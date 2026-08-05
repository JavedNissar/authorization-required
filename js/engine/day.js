// Day runner: clock, quota, pacing. Day content is data (content/days/*.json).
import { rng, shuffle } from './rng.js';

export class Day {
  constructor(dayData, seed) {
    this.data = dayData;
    this.r = rng(seed + dayData.day * 7919);
    this.queue = shuffle(this.r, dayData.calls.filter(c => !c.fixedTime)).map(c => ({ ...c }));
    this.fixed = dayData.calls
      .filter(c => c.fixedTime)
      .map(c => ({ ...c, at: toMinutes(c.fixedTime) }))
      .sort((a, b) => a.at - b.at);
    this.t = 8 * 60;
    this.end = dayData.endMinutes ?? 17 * 60;
    this.nextAt = Infinity;
    this.armNext();
  }

  nextGap() {
    const remaining = this.queue.length + this.fixed.length;
    const span = Math.max(0, this.end - this.t);
    const base = remaining ? Math.min(span / Math.max(remaining, 1), 40) : span;
    return 4 + this.r() * Math.max(6, base * 0.6);
  }

  // Advance the shift by the supplied amount. Calls are only removed when
  // dispatch is allowed; the controller supplies fixed costs while audio plays.
  tick(dtMin, canDispatch = true) {
    this.t = Math.min(this.end, this.t + Math.max(0, dtMin));
    if (!canDispatch || this.t >= this.end) return null;

    if (this.fixed.length && this.t >= this.fixed[0].at) return this.fixed.shift();
    if (this.queue.length && this.t >= this.nextAt) return this.queue.shift();
    return null;
  }

  spend(minutes) { this.t = Math.min(this.end, this.t + Math.max(0, minutes)); }
  armNext() { this.nextAt = this.t + this.nextGap(); }
  get done() { return !this.queue.length && !this.fixed.length; }
  get over() { return this.t >= this.end; }
  get clock() {
    const h = Math.floor(this.t / 60), m = Math.floor(this.t % 60);
    return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
  }
}

function toMinutes(hhmm) {
  const [h, m] = hhmm.split(':').map(Number);
  return h * 60 + m;
}
