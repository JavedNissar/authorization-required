// Boot + wiring: engine ↔ desk ↔ fiche ↔ terminal.
import { Game } from './engine/game.js';
import { Day } from './engine/day.js';
import { loadDay, makeCtx } from './data/days.js';
import { buildScript, callbackScript } from './data/lines.js';
import { merchantName } from './data/merchants.js';
import * as audio from './engine/audio.js';
import { Desk } from './ui/desk.js';
import { Fiche } from './ui/fiche.js';
import { Terminal } from './ui/terminal.js';
import { renderBulletin, renderFloors, renderAccountIndex, renderAccount, renderMemo, renderRulebook } from './ui/frames.js';
import { renderPaperPage } from './ui/newspaper.js';

const params = new URLSearchParams(location.search);
const parsedSeed = Number.parseInt(params.get('seed') || '1971', 10);
const SEED = Number.isFinite(parsedSeed) ? parsedSeed : 1971;
const parsedSpeed = Number.parseFloat(params.get('speed') || '3');
const SPEED = Number.isFinite(parsedSpeed) && parsedSpeed > 0 ? parsedSpeed : 3; // game minutes / real second
const parsedDay = Number.parseInt(params.get('day') || '1', 10);

const desk = new Desk();
const game = new Game(SEED);
const fiche = new Fiche(document.getElementById('fiche'));
const term = new Terminal(document.getElementById('terminal'), document.getElementById('term-text'));

let dayNum = Number.isFinite(parsedDay) ? Math.max(1, Math.min(14, parsedDay)) : 1;
let day = null, ctx = null, rules = null;
let lastTick = performance.now();
let lookupPan = null;
let running = false;
let dayEnding = false;

const $ = id => document.getElementById(id);

async function boot() {
  bind();
  try {
    await startDay(dayNum);
    $('btn-begin').focus();
  } catch (err) {
    console.error(err);
    $('intro-title').textContent = 'RECORDS UNAVAILABLE';
    $('btn-begin').disabled = true;
  }
}

function bind() {
  $('btn-pickup').onclick = () => game.pickup();
  $('btn-approve').onclick = () => game.approve();
  $('btn-decline').onclick = () => game.decline();
  $('btn-callback').onclick = () => game.callback();

  $('btn-mute').onclick = e => flipToggle(e.currentTarget, 'SOUND', enabled => audio.setMuted(!enabled));

  $('btn-begin').onclick = async () => {
    $('intro').classList.add('hidden');
    try { await audio.initAudio(); audio.startHum(); } catch { /* silent stub remains playable */ }
    lastTick = performance.now();
    running = true;
    fiche.cv.focus();
    requestAnimationFrame(tick);
  };

  // Unlock audio on either pointer or keyboard use; no permission prompt.
  document.addEventListener('pointerdown', () => audio.initAudio().catch(() => {}), { once: true });
  document.addEventListener('keydown', () => audio.initAudio().catch(() => {}), { once: true });
}

function flipToggle(btn, label, apply) {
  const enabled = btn.getAttribute('aria-pressed') !== 'true';
  btn.setAttribute('aria-pressed', String(enabled));
  btn.textContent = `${label} ${enabled ? 'ON' : 'OFF'}`;
  apply(enabled);
}

async function startDay(n) {
  const data = await loadDay(n);
  ctx = makeCtx(data, SEED);
  rules = data.rules;
  day = new Day(data, SEED);
  game.beginDay();
  lookupPan = null;
  dayEnding = false;

  fiche.day = n;
  fiche.setFrames(buildFrames(data));
  fiche.centerOn(0, 0);
  fiche.zoom = 1;
  fiche.focus = 1;
  term.reset();
  desk.hideReadback();
  desk.enable([]);
  desk.setPhone('idle', 'LINE IDLE');
  desk.subtitle('');
  desk.transcriptClear();
  desk.setMeta('');
  desk.setMemos(data.memos || []);

  $('clock').textContent = day.clock;
  $('daylabel').textContent = `DAY ${n} — ${data.date}`;
  desk.logline(data.brief || '');
  if (n >= 6) term.show(); else term.hide();
  updatePay();
}

function buildFrames(data) {
  const frames = [];
  // Row 0: current bulletin, floor sheet, account index, standing rules.
  frames.push({ id: 'bulletin', title: 'BULLETIN', col: 0, row: 0, render: (c, w, h, d) => renderBulletin(c, w, h, d, { edition: data.bulletin.edition, date: data.bulletin.date, numbers: [...ctx.bulletin].sort() }) });
  frames.push({ id: 'floors', title: 'FLOORS', col: 1, row: 0, render: (c, w, h) => renderFloors(c, w, h) });
  const accts = [...ctx.accounts.values()].sort((a, b) => a.pan.localeCompare(b.pan));
  frames.push({ id: 'acct-idx', title: 'ACCOUNTS', col: 2, row: 0, render: (c, w, h, d) => renderAccountIndex(c, w, h, d, { count: accts.length, accounts: accts }) });
  frames.push({ id: 'rules', title: 'RULES', col: 3, row: 0, render: (c, w, h, d) => renderRulebook(c, w, h, d, data.rulebook || []) });
  // Row 1: the pulled account and today's paper memos.
  frames.push({ id: 'acct', title: 'ACCT DETAIL', col: 0, row: 1, render: (c, w, h, d) => renderAccount(c, w, h, d, lookupPan ? ctx.accounts.get(lookupPan) : null) });
  (data.memos || []).slice(0, 3).forEach((m, i) => {
    frames.push({ id: `memo${i}`, title: 'MEMO', col: 1 + i, row: 1, render: (c, w, h, d) => renderMemo(c, w, h, d, m) });
  });
  // Row 2: the weekly paper.
  (data.paper || []).forEach((p, i) => {
    frames.push({ id: `paper${i}`, title: `PAPER ${i + 1}`, col: i, row: 2, blank: p.blank, render: (c, w, h, d) => renderPaperPage(c, w, h, d, p) });
  });
  // Peripheral late-game frames; no text ever acknowledges them.
  (data.extraFrames || []).forEach((f, i) => {
    const render = f.kind === 'deskPhoto'
      ? (c, w, h) => renderDeskPhoto(c, w, h, f.stamp)
      : f.text ? (c) => { c.font = '14px "Courier New",monospace'; c.fillText(f.text, 40, 260); } : null;
    frames.push({ id: `x${i}`, title: '', col: f.col, row: f.row, blank: f.blank, render });
  });
  return frames;
}

function renderDeskPhoto(c, w, h, stamp) {
  c.save();
  c.globalAlpha = 0.78;
  c.lineWidth = 4;
  // A grainy overhead view of the exact desk geometry: reader left, live
  // controls right, handset above. It is never named in text.
  c.strokeRect(54, 54, w - 108, h - 108);
  c.strokeRect(92, 112, 410, 274);
  c.strokeRect(530, 188, 138, 174);
  c.strokeRect(548, 215, 102, 58);
  c.beginPath();
  c.moveTo(542, 119); c.quadraticCurveTo(598, 82, 655, 120);
  c.lineTo(640, 146); c.quadraticCurveTo(598, 119, 557, 146); c.closePath(); c.stroke();
  c.fillRect(548, 294, 46, 22); c.fillRect(604, 294, 46, 22);
  c.beginPath(); c.arc(298, 250, 7, 0, Math.PI * 2); c.fill();
  c.font = '12px "Courier New",monospace';
  c.fillText(stamp || '', w - 190, h - 66);
  c.restore();
}

function tick(now) {
  if (!running || !day) return;
  const dt = Math.min(0.2, Math.max(0, (now - lastTick) / 1000));
  lastTick = now;

  const dispatchable = game.state === 'IDLE' || game.state === 'RESOLVED';
  const clockRuns = game.state !== 'LISTENING' && game.state !== 'CALLBACK';
  const call = day.tick(clockRuns ? dt * SPEED : 0, dispatchable);
  $('clock').textContent = day.clock;
  audio.setHumLevel(fiche.flicker);

  if (call) fireCall(call);

  if (day.over) {
    if (game.state === 'RINGING') game.miss('closing time');
    if (game.state === 'IDLE' || game.state === 'RESOLVED') {
      endDay();
      return;
    }
  }
  if (running) requestAnimationFrame(tick);
}

function fireCall(call) {
  if (!game.startCall(call, ctx, rules)) return;
  desk.setPhone('ringing', 'LINE RINGING');
  desk.subtitle('— the phone is ringing —');
  desk.transcriptClear();
  desk.setMeta(`<b>INCOMING</b> · ${displayMerchant(call).toUpperCase()}`);
  desk.enable(['btn-pickup']);
  audio.startRing();
}

game.on('state', async ({ state, ...detail }) => {
  switch (state) {
    case 'LISTENING': {
      audio.stopRing();
      audio.pickupClick();
      day.spend(dayNum >= 6 ? 2 : 5);
      desk.setPhone('live', 'LINE LIVE');
      desk.enable([]);
      const activeCall = game.call;
      for (const fragment of buildScript(activeCall)) {
        if (game.state !== 'LISTENING' || game.call !== activeCall) return;
        desk.subtitle(fragment.text);
        desk.transcriptAdd(fragment.transcript || fragment.text);
        await audio.speakLine(fragment.id, fragment.text);
      }
      if (game.state !== 'LISTENING' || game.call !== activeCall) return;

      lookupPan = activeCall.card.pan;
      desk.setMeta(`<b>${displayMerchant(activeCall)}</b> · LINE OPEN`);
      if (dayNum >= 6) {
        const verdict = activeCall.terminalVerdict || game.correct;
        await term.query(activeCall.card.pan, activeCall.amount, activeCall.brand || 'CHARGEX');
        await term.verdict(verdict, game.code);
      }
      if (game.state === 'LISTENING') game.doneListening();
      break;
    }

    case 'DELIBERATING': {
      desk.setPhone('hold', detail.afterCallback ? 'CALL BACK COMPLETE' : 'ON HOLD');
      desk.subtitle(detail.afterCallback
        ? '— you have the merchant’s answer. the original line is still open. —'
        : '— the line is open. the merchant is waiting. —');
      const enabled = ['btn-approve', 'btn-decline'];
      if (game.callbackCount === 0) enabled.push('btn-callback');
      desk.enable(enabled);
      fiche.cv.focus();
      break;
    }

    case 'CODE_READBACK':
      desk.enable([]);
      desk.buildCodeGrid(detail.code, chosen => { desk.hideReadback(); game.readback(chosen); });
      break;

    case 'CALLBACK': {
      day.spend(20);
      desk.enable([]);
      desk.setPhone('live', 'CALLING BACK');
      desk.transcriptAdd('— you dial the merchant back —', 'cb-mark');
      const activeCall = game.call;
      for (const fragment of callbackScript(activeCall)) {
        if (game.state !== 'CALLBACK' || game.call !== activeCall) return;
        desk.subtitle(fragment.text);
        desk.transcriptAdd(fragment.text);
        await audio.speakLine(fragment.id, fragment.text);
      }
      if (game.state !== 'CALLBACK' || game.call !== activeCall) return;
      const reveal = ['stolen', 'deadman', 'impersonating', 'ghost', 'split', 'ownpan', 'tomorrow', 'address']
        .find(k => activeCall.truth?.[k]);
      if (reveal) activeCall.truth.revealed = reveal;
      game.afterCallback();
      break;
    }

    case 'RESOLVED': {
      audio.stopRing();
      audio.pickupClick();
      desk.hideReadback();
      desk.setPhone('idle', 'LINE IDLE');
      desk.enable([]);
      const messages = {
        'correct-approve': 'Approved. Code read back. The merchant hangs up satisfied.',
        'correct-decline': 'Declined. A short silence, then the click of the receiver.',
        'wrong-approve': `Approved. The bank will absorb $${detail.call.amount.toFixed(2)} of that, eventually.`,
        'wrong-decline': 'Declined. There will be a complaint about that.',
        'misread': 'The merchant writes down the wrong authorization code. A complaint follows.',
        'missed': 'Closing time. The unanswered line goes dead.',
      };
      desk.subtitle('');
      desk.logline(messages[detail.outcome] || '');
      updatePay();
      if (!day.over) day.armNext();
      fiche.cv.focus();
      break;
    }
  }
});

function updatePay() {
  const t = game.totals;
  const pay = $('pay');
  pay.textContent = `$${t.money.toFixed(2)}  ·  ✗${t.complaints}  ·  −$${t.losses.toFixed(2)}`;
  pay.setAttribute('aria-label', `Total commission ${t.money.toFixed(2)} dollars; ${t.complaints} complaints; ${t.losses.toFixed(2)} dollars in losses`);
  $('quota').textContent = `QUOTA ${game.handled}/${day.data.quota}`;
}

function endDay() {
  if (dayEnding) return;
  dayEnding = true;
  running = false;
  audio.stopRing();
  const met = game.handled >= day.data.quota;
  const body = `
    <table>
      <tr><td>Calls handled</td><td>${game.handled} / quota ${day.data.quota} ${met ? '✓' : '✗ SHORT'}</td></tr>
      <tr><td>Calls unanswered</td><td>${game.missed}</td></tr>
      <tr><td>Commission today</td><td>$${game.money.toFixed(2)}</td></tr>
      <tr><td>Fraud losses today</td><td>$${game.losses.toFixed(2)}</td></tr>
      <tr><td>Complaints today</td><td>${game.complaints}</td></tr>
    </table>
    <p>${day.data.epilogue || ''}</p>`;

  desk.dayEnd(`DAY ${dayNum} — ${day.data.date} — SHIFT END`, body, async () => {
    if (dayNum >= 14) return showEnding();
    dayNum += 1;
    await startDay(dayNum);
    lastTick = performance.now();
    running = true;
    fiche.cv.focus();
    requestAnimationFrame(tick);
  });
}

function showEnding() {
  const t = game.totals;
  const ledger = `<p>The phone does not ring.</p>
    <table>
      <tr><td>Total calls handled</td><td>${t.handled}</td></tr>
      <tr><td>Total commission</td><td>$${t.money.toFixed(2)}</td></tr>
      <tr><td>Losses entered in the ledger</td><td>$${t.losses.toFixed(2)}</td></tr>
      <tr><td>Complaints attached to your name</td><td>${t.complaints}</td></tr>
    </table>`;
  desk.dayEnd('AUTHORIZATION REQUIRED', ledger, () => {
    location.href = `${location.pathname}?seed=${SEED}`;
  }, 'START OVER');
}

function displayMerchant(call) { return call.merchantLabel || merchantName(call.merchant); }

boot();
