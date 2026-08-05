// Procedural audio: ring, telephone-filtered voice murmur, lamp hum, terminal beeps.
// Drop-in point for real clips: if content/audio/lines.json exists with file paths,
// playFragment() will fetch & decode those instead of synthesizing the murmur.

let ctx = null, master = null, muted = false;
let humNodes = null, ringTimer = null;
let clipManifest = null, clipBuffers = new Map();

export async function initAudio() {
  if (ctx) {
    if (ctx.state === 'suspended') await ctx.resume();
    return;
  }
  ctx = new (window.AudioContext || window.webkitAudioContext)();
  master = ctx.createGain();
  master.gain.value = muted ? 0 : 0.8;
  master.connect(ctx.destination);
  try {
    const r = await fetch('content/audio/lines.json');
    if (r.ok) {
      const data = await r.json();
      const lines = Array.isArray(data) ? data : (data.lines || Object.values(data));
      clipManifest = Object.fromEntries(lines.filter(line => line?.id).map(line => [line.id, line]));
    }
  } catch { /* stub mode */ }
  if (ctx.state === 'suspended') await ctx.resume();
}

export function setMuted(m) {
  muted = m;
  if (master) master.gain.value = m ? 0 : 0.8;
}

// Telephone band: 300–3400 Hz, light grit.
function telephoneChain(input) {
  if (!ctx) return input;
  const bp = ctx.createBiquadFilter();
  bp.type = 'bandpass'; bp.frequency.value = 1850; bp.Q.value = 0.6;
  const hp = ctx.createBiquadFilter();
  hp.type = 'highpass'; hp.frequency.value = 300;
  const lp = ctx.createBiquadFilter();
  lp.type = 'lowpass'; lp.frequency.value = 3400;
  const shaper = ctx.createWaveShaper();
  const curve = new Float32Array(256);
  for (let i = 0; i < 256; i++) { const x = i / 128 - 1; curve[i] = Math.tanh(x * 2.2); }
  shaper.curve = curve;
  input.connect(hp); hp.connect(bp); bp.connect(lp); lp.connect(shaper);
  return shaper;
}

// --- phone ring: twin bell strikes, NA cadence 2s on / 4s off ---
export function startRing() {
  if (!ctx) return;
  stopRing();
  const cycle = () => {
    bell(); setTimeout(bell, 350);
  };
  cycle();
  ringTimer = setInterval(cycle, 2500);
}
export function stopRing() { if (ringTimer) { clearInterval(ringTimer); ringTimer = null; } }

function bell() {
  if (!ctx) return;
  const t = ctx.currentTime;
  for (const f of [1400, 1780]) {
    const o = ctx.createOscillator(), g = ctx.createGain();
    o.type = 'sine'; o.frequency.value = f;
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(0.22, t + 0.01);
    g.gain.exponentialRampToValueAtTime(0.0001, t + 0.28);
    o.connect(g); g.connect(master);
    o.start(t); o.stop(t + 0.3);
  }
}

export function pickupClick() {
  if (!ctx) return;
  const t = ctx.currentTime;
  const b = ctx.createBuffer(1, 2200, ctx.sampleRate);
  const d = b.getChannelData(0);
  for (let i = 0; i < d.length; i++) d[i] = (Math.random() * 2 - 1) * Math.exp(-i / 300);
  const s = ctx.createBufferSource(); s.buffer = b;
  const g = ctx.createGain(); g.gain.value = 0.5;
  s.connect(g); g.connect(master); s.start(t);
}

// --- voice murmur: shaped noise bursts following a text cadence ---
// Returns a promise resolving when the "line" finishes. Duration ~ words.
export async function speakLine(lineId, text) {
  if (!ctx) { await new Promise(r => setTimeout(r, 300)); return; }
  if (clipManifest && clipManifest[lineId]?.file) {
    try { return await playClip(lineId); }
    catch { /* missing/bad optional clip: fall through to procedural stub */ }
  }
  const words = Math.max(1, text.split(/\s+/).length);
  const dur = Math.min(6, 0.28 + words * 0.16);
  const t = ctx.currentTime;
  const src = ctx.createBufferSource();
  src.buffer = noiseBuffer(dur + 0.2);
  const env = ctx.createGain();
  env.gain.value = 0;
  // syllabic envelope
  let tt = t;
  const syl = Math.max(2, Math.round(words * 2.2));
  for (let i = 0; i < syl; i++) {
    const seg = dur / syl;
    env.gain.setValueAtTime(0.001, tt);
    env.gain.linearRampToValueAtTime(0.16 + Math.random() * 0.1, tt + seg * 0.4);
    env.gain.linearRampToValueAtTime(0.03, tt + seg);
    tt += seg * (0.85 + Math.random() * 0.3);
  }
  env.gain.setValueAtTime(0.0001, t + dur + 0.15);
  const out = telephoneChain(env);
  src.connect(env); out.connect(master);
  src.start(t); src.stop(t + dur + 0.2);
  await new Promise(r => setTimeout(r, dur * 1000 + 120));
}

async function playClip(lineId) {
  const entry = clipManifest[lineId];
  if (!clipBuffers.has(lineId)) {
    const ab = await (await fetch('content/audio/' + entry.file)).arrayBuffer();
    clipBuffers.set(lineId, await ctx.decodeAudioData(ab));
  }
  const s = ctx.createBufferSource(); s.buffer = clipBuffers.get(lineId);
  const out = telephoneChain(s); out.connect(master); s.start();
  await new Promise(r => setTimeout(r, s.buffer.duration * 1000));
}

function noiseBuffer(sec) {
  const n = Math.floor(sec * ctx.sampleRate);
  const b = ctx.createBuffer(1, n, ctx.sampleRate);
  const d = b.getChannelData(0);
  let last = 0;
  for (let i = 0; i < n; i++) { // brownish noise — voice-ish through the filter
    const w = Math.random() * 2 - 1;
    last = (last + 0.04 * w) / 1.04;
    d[i] = last * 4.5;
  }
  return b;
}

// --- lamp hum, tied to flicker value by setHumLevel(0..1) ---
export function startHum() {
  if (!ctx || humNodes) return;
  const o = ctx.createOscillator(), o2 = ctx.createOscillator(), g = ctx.createGain();
  o.type = 'sawtooth'; o.frequency.value = 60;
  o2.type = 'sine'; o2.frequency.value = 120;
  g.gain.value = 0.012;
  o.connect(g); o2.connect(g); g.connect(master);
  o.start(); o2.start();
  humNodes = { g };
}
export function setHumLevel(v) { if (humNodes) humNodes.g.gain.value = 0.004 + v * 0.016; }

// --- terminal ---
export function termBeep(ok = true) {
  if (!ctx) return;
  const t = ctx.currentTime;
  const o = ctx.createOscillator(), g = ctx.createGain();
  o.type = 'square'; o.frequency.value = ok ? 880 : 240;
  g.gain.setValueAtTime(0.06, t);
  g.gain.exponentialRampToValueAtTime(0.0001, t + (ok ? 0.09 : 0.3));
  o.connect(g); g.connect(master); o.start(t); o.stop(t + 0.35);
}
export function keyClick() {
  if (!ctx) return;
  const t = ctx.currentTime;
  const b = ctx.createBuffer(1, 800, ctx.sampleRate);
  const d = b.getChannelData(0);
  for (let i = 0; i < d.length; i++) d[i] = (Math.random() * 2 - 1) * Math.exp(-i / 120);
  const s = ctx.createBufferSource(); s.buffer = b;
  const g = ctx.createGain(); g.gain.value = 0.12;
  s.connect(g); g.connect(master); s.start(t);
}
