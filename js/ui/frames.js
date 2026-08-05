// Frame content renderers: bulletin, account file, floor limits, memos, rulebook.
// These draw typeset text onto a fiche frame canvas ctx.

import { MERCHANTS, FLOOR_LIMITS, merchantName } from '../data/merchants.js';

function header(c, title, sub) {
  c.font = '700 22px "Courier New", monospace';
  c.fillText(title, 28, 44);
  c.font = '13px "Courier New", monospace';
  c.fillText(sub || '', 28, 64);
  c.fillRect(28, 74, 700, 1.5);
}

export function renderBulletin(c, w, h, d, data) {
  header(c, `HOT CARD BULLETIN — ${data.edition}`, `CANCELLED / STOLEN NUMBERS · DATED ${data.date} · BY MAIL`);
  c.font = '14px "Courier New", monospace';
  // Numbers arrive pre-sorted; fill down each column so the list scans
  // ascending vertically, the way printed hot card bulletins were typeset.
  const cols = 4, colW = 168, maxRows = 28;
  const rows = Math.min(maxRows, Math.ceil(data.numbers.length / cols) || 1);
  data.numbers.forEach((n, i) => {
    const col = Math.floor(i / rows), row = i % rows;
    if (col >= cols) return;
    c.fillText(n, 32 + col * colW, 100 + row * 15.5);
  });
  c.font = 'italic 12px "Courier New", monospace';
  c.fillText('NUMBERS CANCELLED AFTER THIS PRINTING DO NOT APPEAR. — AUTHORIZATION CENTRE', 28, h - 20);
}

export function renderFloors(c, w, h) {
  header(c, 'FLOOR LIMITS BY MERCHANT CATEGORY', 'CHARGES AT/UNDER LIMIT ARE NOT TO BE CALLED IN');
  c.font = '15px "Courier New", monospace';
  const cats = Object.entries(FLOOR_LIMITS);
  cats.forEach(([k, v], i) => {
    const col = i % 2, row = Math.floor(i / 2);
    c.fillText(`${k.toUpperCase().padEnd(12, ' ')} $${String(v).padStart(4, ' ')}`, 40 + col * 340, 110 + row * 24);
  });
  c.font = '12px "Courier New", monospace';
  c.fillText('IF A MERCHANT CALLS IN A CHARGE UNDER FLOOR LIMIT, NOTE IT.', 40, h - 30);
}

export function renderAccountIndex(c, w, h, d, data) {
  header(c, 'ACCOUNT FILE — INDEX', `PULL BY CARD NUMBER · ${data.count} ACCOUNTS ON FILE`);
  c.font = '12.5px "Courier New", monospace';
  c.fillText('CARD NUMBER      NAME              CITY          LIMIT   STATUS', 28, 96);
  c.fillRect(28, 102, 700, 1);
  data.accounts.slice(0, 26).forEach((a, i) => {
    c.fillText(`${a.pan.padEnd(17,' ')}${a.name.padEnd(18,' ')}${a.city.padEnd(14,' ')}$${String(a.limit).padEnd(7,' ')}${a.status}`, 28, 122 + i * 15);
  });
}

export function renderAccount(c, w, h, d, acct) {
  if (!acct) {
    header(c, 'ACCOUNT FILE — DETAIL', 'NO RECORD ON FILE');
    c.font = '18px "Courier New", monospace';
    c.fillText('—— NO CARD WITH THIS NUMBER ——', 180, 260);
    return;
  }
  header(c, 'ACCOUNT FILE — DETAIL', `PULLED ${acct.pan}`);
  c.font = '16px "Courier New", monospace';
  const rows = [
    ['CARD', acct.pan], ['NAME', acct.name], ['CITY', acct.city],
    ['LIMIT', '$' + acct.limit], ['BALANCE', '$' + acct.balance.toFixed(2)],
    ['STATUS', acct.status.toUpperCase()], ['ISSUED', acct.issued],
  ];
  rows.forEach(([k, v], i) => {
    c.font = '700 15px "Courier New", monospace'; c.fillText(k.padEnd(9, ' '), 60, 120 + i * 34);
    c.font = '15px "Courier New", monospace'; c.fillText(String(v), 220, 120 + i * 34);
  });
  if (acct.note) { c.font = 'italic 13px "Courier New", monospace'; c.fillText(acct.note, 60, h - 36); }
}

export function renderMemo(c, w, h, d, memo) {
  header(c, `MEMO — ${memo.from}`, `DATE: ${memo.date}`);
  c.font = '14px "Courier New", monospace';
  wrap(c, memo.text, 28, 104, 700, 20);
  c.font = 'italic 12px "Courier New", monospace';
  c.fillText(memo.sig || '— HEAD OFFICE', 28, h - 22);
}

export function renderRulebook(c, w, h, d, rules) {
  header(c, 'STANDING RULES — AUTHORIZATION DESK', 'CURRENT COMPILATION · CHECK DATES');
  c.font = '13.5px "Courier New", monospace';
  let y = 102;
  for (const r of rules) {
    c.font = '700 13.5px "Courier New", monospace';
    c.fillText(`${r.date}`, 28, y);
    c.font = '13.5px "Courier New", monospace';
    y = wrap(c, r.text, 110, y, 620, 18) + 12;
    if (y > h - 40) break;
  }
}

export function wrap(c, text, x, y, maxW, lh) {
  const words = text.split(' ');
  let line = '';
  for (const wd of words) {
    const t = line ? line + ' ' + wd : wd;
    if (c.measureText(t).width > maxW) { c.fillText(line, x, y); y += lh; line = wd; }
    else line = t;
  }
  if (line) { c.fillText(line, x, y); y += lh; }
  return y;
}

export { merchantName };
