// Game state machine: RINGING → LISTENING → DELIBERATING → CODE_READBACK → RESOLVED
// DELIBERATING may branch through CALLBACK before resolution.
// Pure logic + event emitter; no DOM.

import { evaluate } from './rules.js';
import { rng } from './rng.js';

export class Game {
  constructor(seed = 1971) {
    this.seed = seed >>> 0;
    this.state = 'IDLE';
    this.listeners = {};
    this.totals = { money: 0, losses: 0, complaints: 0, handled: 0, missed: 0 };
    this.beginDay();
  }

  on(ev, fn) { (this.listeners[ev] ||= []).push(fn); }
  emit(ev, data) { (this.listeners[ev] || []).forEach(f => f(data)); }
  setState(s, data = {}) { this.state = s; this.emit('state', { state: s, ...data }); }

  beginDay() {
    this.state = 'IDLE';
    this.call = null;
    this.eval = null;
    this.correct = null;
    this.code = null;
    this.callbackCount = 0;
    this.money = 0;
    this.losses = 0;
    this.complaints = 0;
    this.handled = 0;
    this.missed = 0;
    this.outcomes = [];
  }

  // Backwards-compatible name used by older harnesses.
  reset() { this.beginDay(); }

  startCall(call, ctx, rules) {
    if (!['IDLE', 'RESOLVED'].includes(this.state)) return false;
    this.call = call;
    this.ctx = ctx;
    this.rules = rules;
    this.eval = evaluate(rules, call, ctx);
    // Routine calls are resolved by the predicate engine. Authored anomalies can
    // carry a canonical verdict based on newspaper/voice evidence outside it.
    this.correct = call.correct ?? this.eval.verdict;
    this.code = this.makeCode(call.id);
    this.callbackCount = 0;
    this.setState('RINGING', { call });
    return true;
  }

  pickup() {
    if (this.state !== 'RINGING') return;
    this.setState('LISTENING', { call: this.call });
  }

  doneListening() {
    if (this.state === 'LISTENING') this.setState('DELIBERATING', { call: this.call });
  }

  approve() {
    if (this.state !== 'DELIBERATING') return;
    this.setState('CODE_READBACK', { code: this.code });
  }

  readback(chosen) {
    if (this.state !== 'CODE_READBACK') return;
    if (chosen !== this.code) return this.resolve('misread');
    this.resolve(this.correct === 'approve' ? 'correct-approve' : 'wrong-approve');
  }

  decline() {
    if (this.state !== 'DELIBERATING') return;
    this.resolve(this.correct === 'decline' ? 'correct-decline' : 'wrong-decline');
  }

  callback() {
    if (this.state !== 'DELIBERATING' || this.callbackCount > 0) return;
    this.callbackCount += 1;
    this.setState('CALLBACK', { call: this.call });
  }

  afterCallback() {
    // Callback may expose a predicate that was previously unavailable.
    this.eval = evaluate(this.rules, this.call, this.ctx);
    this.setState('DELIBERATING', { call: this.call, afterCallback: true });
  }

  miss(reason = 'unanswered') {
    if (this.state !== 'RINGING') return;
    this.resolve('missed', { reason });
  }

  resolve(outcome, extra = {}) {
    const c = this.call;
    const o = { outcome, call: c, eval: this.eval, correct: this.correct, ...extra };
    switch (outcome) {
      case 'correct-approve': this.add('money', 0.12); break;
      case 'correct-decline': this.add('money', 0.08); break;
      case 'wrong-approve':   this.add('losses', c.amount); break;
      case 'wrong-decline':   this.add('complaints', 1); break;
      case 'misread':         this.add('complaints', 1); break;
      case 'missed':
        this.missed += 1;
        this.totals.missed += 1;
        this.add('complaints', 1);
        break;
    }
    if (outcome !== 'missed') {
      this.handled += 1;
      this.totals.handled += 1;
    }
    this.outcomes.push(o);
    this.setState('RESOLVED', o);
  }

  add(field, amount) {
    this[field] += amount;
    this.totals[field] += amount;
  }

  makeCode(id) {
    let h = this.seed ^ 0x41555448; // "AUTH"
    for (const ch of String(id)) h = Math.imul(h ^ ch.charCodeAt(0), 16777619);
    const r = rng(h >>> 0);
    const letters = 'ABCDEFGHJKMNPQRSTUVWXYZ';
    return letters[Math.floor(r() * letters.length)] + String(Math.floor(r() * 900) + 100);
  }
}
