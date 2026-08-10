// Microfiche reader: frame grid, carriage movement, fixed film composite.
// 2D canvas stack: render frame → film grade → vignette/grain/scratches/flicker.

import { rng } from '../engine/rng.js';

const FRAME_W = 760, FRAME_H = 520, GAP = 60;
const FILM_GRADE = 0.12;

export class Fiche {
  constructor(canvas) {
    this.cv = canvas;
    this.cx = canvas.getContext('2d');
    this.frames = []; // {id,title,col,row,render(ctx,w,h)}
    this.camX = 0; this.camY = 0; this.tx = 0; this.ty = 0;
    this.zoom = 1;
    this.day = 1;
    this.flicker = 1;
    this.focus = 1; // 0..1 player knob
    this.reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
    this.driftSeed = rng(1234);
    this.scratches = this.makeScratches();
    this.dust = this.makeDust();
    this.t0 = performance.now();
    this.onFrame = null;
    canvas.addEventListener('keydown', e => this.keys(e));
    canvas.addEventListener('pointerdown', e => this.pointerDown(e));
    canvas.addEventListener('pointermove', e => this.pointerMove(e));
    canvas.addEventListener('pointerup', e => this.pointerUp(e));
    canvas.addEventListener('pointercancel', e => this.pointerUp(e));
    requestAnimationFrame(t => this.loop(t));
  }

  setFrames(frames) {
    this.frames = frames;
    this.maxCol = Math.max(...frames.map(f => f.col), 0);
    this.maxRow = Math.max(...frames.map(f => f.row), 0);
  }

  // frame addressing: col,row on a fiche sheet
  addFrame(f) { this.frames.push(f); }

  frameAt(col, row) { return this.frames.find(f => f.col === col && f.row === row); }

  centerOn(col, row) {
    this.tx = col * (FRAME_W + GAP) + FRAME_W / 2;
    this.ty = row * (FRAME_H + GAP) + FRAME_H / 2;
  }

  jump(i) {
    const shortcuts = ['bulletin', 'floors', 'acct', 'rules', 'memo0', 'paper0', 'paper1', 'paper2', 'paper3'];
    const f = this.frames.find(frame => frame.id === shortcuts[i]);
    if (f) this.centerOn(f.col, f.row);
  }

  keys(e) {
    const step = 1;
    const cur = this.nearest();
    let { col, row } = cur;
    if (e.key === 'ArrowRight') col += step;
    else if (e.key === 'ArrowLeft') col -= step;
    else if (e.key === 'ArrowDown') row += step;
    else if (e.key === 'ArrowUp') row -= step;
    else if (e.key === 'PageDown') { e.preventDefault(); this.zoom = Math.min(2.2, this.zoom + 0.2); return; }
    else if (e.key === 'PageUp') { e.preventDefault(); this.zoom = Math.max(0.6, this.zoom - 0.2); return; }
    else if (/^[1-9]$/.test(e.key)) { e.preventDefault(); this.jump(+e.key - 1); return; }
    else if (e.key === 'f' || e.key === 'F') { e.preventDefault(); this.focus = Math.min(1, this.focus + 0.1); return; }
    else if (e.key === 'g' || e.key === 'G') { e.preventDefault(); this.focus = Math.max(0, this.focus - 0.1); return; }
    else return;
    e.preventDefault();
    col = Math.max(0, Math.min(this.maxCol, col));
    row = Math.max(0, Math.min(this.maxRow, row));
    this.centerOn(col, row);
    if (this.onFrame) this.onFrame(this.frameAt(col, row));
  }

  nearest() {
    const col = Math.round((this.tx - FRAME_W / 2) / (FRAME_W + GAP));
    const row = Math.round((this.ty - FRAME_H / 2) / (FRAME_H + GAP));
    return { col: Math.max(0, Math.min(this.maxCol, col)), row: Math.max(0, Math.min(this.maxRow, row)) };
  }

  pointerDown(e) {
    this.cv.focus();
    this.drag = { x: e.clientX, y: e.clientY, tx: this.tx, ty: this.ty };
    this.cv.setPointerCapture?.(e.pointerId);
    this.cv.classList.add('dragging');
  }

  pointerMove(e) {
    if (!this.drag) return;
    const rect = this.cv.getBoundingClientRect();
    const sx = this.cv.width / rect.width / this.zoom;
    const sy = this.cv.height / rect.height / this.zoom;
    this.tx = this.drag.tx - (e.clientX - this.drag.x) * sx;
    this.ty = this.drag.ty - (e.clientY - this.drag.y) * sy;
    this.tx = Math.max(FRAME_W / 2, Math.min(this.maxCol * (FRAME_W + GAP) + FRAME_W / 2, this.tx));
    this.ty = Math.max(FRAME_H / 2, Math.min(this.maxRow * (FRAME_H + GAP) + FRAME_H / 2, this.ty));
  }

  pointerUp(e) {
    if (!this.drag) return;
    this.drag = null;
    this.cv.releasePointerCapture?.(e.pointerId);
    this.cv.classList.remove('dragging');
    const { col, row } = this.nearest();
    this.centerOn(col, row);
    if (this.onFrame) this.onFrame(this.frameAt(col, row));
  }

  makeScratches() {
    const r = rng(99);
    return Array.from({ length: 5 }, () => ({ x: r(), a: 0.05 + r() * 0.08, w: 0.5 + r() * 1.5 }));
  }
  makeDust() {
    const r = rng(7);
    return Array.from({ length: 40 }, () => ({ x: r(), y: r(), s: 0.5 + r() * 1.6, a: 0.05 + r() * 0.15 }));
  }

  loop(t) {
    const dt = Math.min(0.05, (t - this.t0) / 1000); this.t0 = t;
    // ease carriage, with late-game drift (disabled for reduced motion)
    const drift = !this.reduced && this.day >= 10 ? Math.sin(t / 3000) * 2 : 0;
    const ease = this.reduced ? 1 : Math.min(1, dt * 6);
    this.camX += (this.tx + drift - this.camX) * ease;
    this.camY += (this.ty - this.camY) * ease;
    // lamp flicker, shared with hum
    this.flicker = this.reduced ? 0.96 : 0.92 + 0.08 * (Math.sin(t / 170) * 0.4 + Math.sin(t / 61) * 0.3 + 0.3);
    this.render(t);
    requestAnimationFrame(tt => this.loop(tt));
  }

  render(t) {
    const c = this.cx, W = this.cv.width, H = this.cv.height;
    // Keep one restrained grade for the whole campaign. Narrative escalation
    // must not make mechanically necessary records harder to read.
    const d = FILM_GRADE;
    const lamp = 0.75 + 0.25 * this.flicker;
    // lens interior: warm bone of projector lamp
    c.fillStyle = `rgb(${Math.floor(40*lamp)},${Math.floor(36*lamp)},${Math.floor(28*lamp)})`;
    c.fillRect(0, 0, W, H);
    c.save();
    c.translate(W / 2, H / 2);
    c.scale(this.zoom, this.zoom);
    c.translate(-this.camX, -this.camY);

    const viewHalfW = W / (2 * this.zoom) + FRAME_W;
    const viewHalfH = H / (2 * this.zoom) + FRAME_H;
    for (const f of this.frames) {
      const x = f.col * (FRAME_W + GAP), y = f.row * (FRAME_H + GAP);
      if (Math.abs(x + FRAME_W / 2 - this.camX) > viewHalfW || Math.abs(y + FRAME_H / 2 - this.camY) > viewHalfH) continue;
      const fx = Math.round(x), fy = Math.round(y);
      // film frame base
      c.fillStyle = f.blank ? `rgba(40,36,28,${0.5 + d * 0.3})` : bone(d, lamp);
      c.fillRect(fx, fy, FRAME_W, FRAME_H);
      // frame border
      c.strokeStyle = `rgba(34,30,22,${0.6 + d * 0.2})`;
      c.lineWidth = 2;
      c.strokeRect(fx, fy, FRAME_W, FRAME_H);
      if (!f.blank && f.render) {
        c.save();
        c.beginPath(); c.rect(fx + 10, fy + 10, FRAME_W - 20, FRAME_H - 20); c.clip();
        c.translate(fx, fy);
        c.fillStyle = ink(d);
        f.render(c, FRAME_W, FRAME_H, d);
        c.restore();
      }
      // frame edge falloff — subtle, so content stays legible
      const g = c.createRadialGradient(fx + FRAME_W / 2, fy + FRAME_H / 2, FRAME_H * 0.45, fx + FRAME_W / 2, fy + FRAME_H / 2, FRAME_W * 0.72);
      g.addColorStop(0, 'rgba(0,0,0,0)');
      g.addColorStop(1, `rgba(10,8,6,${0.14 + d * 0.22})`);
      c.fillStyle = g; c.fillRect(fx, fy, FRAME_W, FRAME_H);
    }
    c.restore();

    // optical falloff over whole lens
    const vg = c.createRadialGradient(W / 2, H / 2, H * 0.42, W / 2, H / 2, W * 0.75);
    vg.addColorStop(0, 'rgba(0,0,0,0)');
    vg.addColorStop(1, `rgba(6,5,4,${0.42 + d * 0.18})`);
    c.fillStyle = vg; c.fillRect(0, 0, W, H);

    // scratches (persistent)
    c.strokeStyle = `rgba(230,220,195,${0.05 + d * 0.05})`;
    for (const s of this.scratches) {
      c.lineWidth = s.w;
      c.beginPath(); c.moveTo(s.x * W, 0); c.lineTo(s.x * W + 8, H); c.stroke();
    }
    // dust (shifts slowly)
    for (const p of this.dust) {
      const dx = this.reduced ? 0 : Math.sin(t / 5000 + p.x * 20) * 6;
      c.fillStyle = `rgba(240,230,205,${p.a * (0.6 + 0.4 * this.flicker)})`;
      c.fillRect(p.x * W + dx, p.y * H, p.s, p.s);
    }
    // hair at edge, always
    c.strokeStyle = 'rgba(20,16,12,0.5)'; c.lineWidth = 1;
    c.beginPath(); c.moveTo(W * 0.02, H * 0.2);
    c.quadraticCurveTo(W * 0.05, H * 0.5, W * 0.03, H * 0.85); c.stroke();

    // restrained grain; density and contrast no longer increase by day
    const n = 32;
    c.fillStyle = 'rgba(0,0,0,0.006)';
    for (let i = 0; i < n; i++) {
      const gx = this.reduced ? ((i * 79 + this.day * 31) % W) : Math.random() * W;
      const gy = this.reduced ? ((i * 43 + this.day * 17) % H) : Math.random() * H;
      c.fillRect(gx, gy, 1.5, 1.5);
    }
    // focus softness
    if (this.focus < 0.9) {
      c.fillStyle = `rgba(216,208,184,${(0.9 - this.focus) * 0.18})`;
      c.fillRect(0, 0, W, H);
    }
  }
}

function bone(d, lamp) {
  const b = 216 - d * 70, g = 208 - d * 74, r = 184 - d * 78;
  return `rgb(${Math.floor(b * lamp)},${Math.floor(g * lamp)},${Math.floor(r * lamp)})`;
}
function ink(d) {
  const v = 34 + d * 10;
  return `rgb(${v},${v - 4},${v - 10})`;
}
function roundRect(c, x, y, w, h, r) {
  c.beginPath();
  c.moveTo(x + r, y);
  c.arcTo(x + w, y, x + w, y + h, r);
  c.arcTo(x + w, y + h, x, y + h, r);
  c.arcTo(x, y + h, x, y, r);
  c.arcTo(x, y, x + w, y, r);
  c.closePath();
}

export const FRAME = { W: FRAME_W, H: FRAME_H };
