// Act II phosphor terminal. The only saturated colour in the game.
import { termBeep, keyClick } from '../engine/audio.js';

export class Terminal {
  constructor(el, textEl) {
    this.el = el;
    this.text = textEl;
    this.queue = Promise.resolve();
    this.reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
  }
  show() { this.el.classList.remove('hidden'); }
  hide() { this.el.classList.add('hidden'); }
  reset() { this.queue = Promise.resolve(); this.text.textContent = ''; }

  async type(str, cps = 55) {
    if (this.reduced) cps = 500;
    this.queue = this.queue.then(() => new Promise(res => {
      let i = 0;
      const tick = () => {
        if (i < str.length) {
          this.text.textContent += str[i];
          if (str[i] !== '\n' && pseudoChance(str, i)) keyClick();
          i++;
          setTimeout(tick, 1000 / cps * (this.reduced ? 0.2 : 0.85 + ((i * 17) % 7) / 20));
        } else res();
      };
      tick();
    }));
    return this.queue;
  }
  async clear() { this.queue = this.queue.then(() => { this.text.textContent = ''; }); return this.queue; }

  async query(pan, amount, brand = 'CHARGEX') {
    await this.clear();
    await this.type(`${brand} AUTHORIZATION\n---------------------\n`);
    await this.type(`CARD  ${pan}\nAMT   $${amount.toFixed(2)}\n`);
    await new Promise(r => setTimeout(r, this.reduced ? 80 : 650));
    return this;
  }

  async verdict(v, code) {
    if (v === 'approve') { termBeep(true); await this.type(`>> APPROVED  CODE ${code}\n`, 30); }
    else if (v === 'decline') { termBeep(false); await this.type('>> DECLINE — DO NOT HONOR\n', 30); }
    else if (v === 'refer') { termBeep(false); await this.type('>> REFER — CALL ISSUER\n', 30); }
    else { termBeep(false); await this.type(`>> ${String(v).toUpperCase()}\n`, 30); }
    return this.queue;
  }
}

function pseudoChance(str, i) { return ((str.charCodeAt(i) * 13 + i * 7) % 10) < 4; }
