// Live desk DOM: phone panel, action buttons, code grid, memos, clock, subtitles.

export class Desk {
  constructor() {
    this.$ = id => document.getElementById(id);
    this.phone = this.$('phone');
    this.lamp = this.$('phone-lamp');
    this.pstate = this.$('phone-state');
    this.sub = this.$('subtitle');
    this.meta = this.$('call-meta');
    this.log = this.$('logline');
    this.subsOn = true;
    this.lastSubtitle = '';
  }

  setPhone(state, label) {
    this.phone.className = state;
    this.pstate.textContent = label ?? state.toUpperCase();
  }
  subtitle(text) {
    this.lastSubtitle = text;
    this.sub.textContent = this.subsOn ? text : '';
  }
  setSubtitles(on) {
    this.subsOn = on;
    this.sub.textContent = on ? this.lastSubtitle : '';
  }
  setMeta(html) { this.meta.innerHTML = html; }
  logline(t) { this.log.textContent = t; }

  enable(which) {
    for (const id of ['btn-approve', 'btn-decline', 'btn-callback', 'btn-replay', 'btn-pickup'])
      this.$(id).disabled = !which.includes(id);
  }

  buildCodeGrid(correct, onPick) {
    const grid = this.$('code-grid');
    grid.innerHTML = '';
    this.$('issued-code').textContent = correct;
    const letters = 'ABCDEFGHJKMNPQRSTUVWXYZ';
    const r = codeRng(correct);
    const codes = new Set([correct]);
    while (codes.size < 6) {
      codes.add(letters[Math.floor(r() * letters.length)] + String(Math.floor(r() * 900) + 100));
    }
    [...codes].sort().forEach(cd => {
      const b = document.createElement('button');
      b.type = 'button';
      b.className = 'code-cell';
      b.textContent = cd;
      b.setAttribute('aria-label', `Read back ${spellCode(cd)}`);
      b.onclick = () => onPick(cd);
      grid.appendChild(b);
    });
    this.$('readback').classList.remove('hidden');
    grid.querySelector('button')?.focus();
  }
  hideReadback() { this.$('readback').classList.add('hidden'); }

  setMemos(memos) {
    const ul = this.$('memos'); ul.innerHTML = '';
    memos.forEach((m, i) => {
      const li = document.createElement('li');
      li.textContent = `${m.date} — ${m.subject}`;
      li.dataset.idx = i;
      ul.appendChild(li);
    });
  }

  dayEnd(title, bodyHtml, onNext, buttonLabel = 'BEGIN NEXT DAY') {
    this.$('day-end-title').textContent = title;
    this.$('day-end-body').innerHTML = bodyHtml;
    const btn = this.$('btn-next-day');
    btn.textContent = buttonLabel;
    this.$('day-end').classList.remove('hidden');
    btn.onclick = () => {
      this.$('day-end').classList.add('hidden');
      onNext();
    };
    btn.focus();
  }
}

function codeRng(code) {
  let a = 0x434f4445;
  for (const ch of code) a = Math.imul(a ^ ch.charCodeAt(0), 2654435761) >>> 0;
  return () => {
    a |= 0; a = (a + 0x6D2B79F5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function spellCode(code) { return `${code[0]}, ${code.slice(1).split('').join(', ')}`; }
