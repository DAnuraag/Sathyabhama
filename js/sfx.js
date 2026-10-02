// ════════════════════════════════════════════════════════════════
//  SFX: tiny sound effects made live with the Web Audio API (no audio files, nothing downloaded).
//  They only run after a click, so browsers allow them. The pixel heart uses these:
//  every tap is a soft chime that climbs the scale, and the last tap is a full sparkle chord with a heartbeat.
// ════════════════════════════════════════════════════════════════
let ctx = null, master = null, noiseBuf = null;

function audio() {
  if (!ctx) {
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return null;
    ctx = new AC();
    master = ctx.createGain(); master.gain.value = 0.5;
    const comp = ctx.createDynamicsCompressor(); master.connect(comp); comp.connect(ctx.destination);
    noiseBuf = ctx.createBuffer(1, ctx.sampleRate * 1.2, ctx.sampleRate);
    const d = noiseBuf.getChannelData(0); for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
  }
  if (ctx.state === 'suspended') ctx.resume();
  return ctx;
}

/* one soft note: attack 8 ms, then an exponential fade */
function note(f, t, dur, { type = 'sine', gain = 0.3, to = null } = {}) {
  const o = ctx.createOscillator(), g = ctx.createGain();
  o.type = type; o.frequency.setValueAtTime(f, t); if (to) o.frequency.exponentialRampToValueAtTime(to, t + dur);
  g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(gain, t + 0.008); g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  o.connect(g); g.connect(master); o.start(t); o.stop(t + dur + 0.05);
}

/* a breath of sparkle: filtered noise */
function shimmer(t, dur, gain, f = 6000) {
  const s = ctx.createBufferSource(); s.buffer = noiseBuf;
  const hp = ctx.createBiquadFilter(); hp.type = 'highpass'; hp.frequency.value = f;
  const g = ctx.createGain(); g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(gain, t + dur * 0.3); g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  s.connect(hp); hp.connect(g); g.connect(master); s.start(t, Math.random() * 0.2, dur + 0.05);
}

const SCALE = [523.25, 587.33, 659.25, 783.99, 880.0, 1046.5, 1174.66, 1318.51];     // C major pentatonic, climbing

/* a normal tap. level 0 = first tap … max-1 = the one before the last: each is higher, fuller and brighter */
export function tapSound(level = 0, max = 8) {
  if (!audio()) return;
  const t = ctx.currentTime + 0.005, k = Math.min(1, level / Math.max(1, max - 1)), f = SCALE[Math.min(level, SCALE.length - 1)];
  note(170, t, 0.14, { gain: 0.32, to: 55 });                                         // the soft "squish" under every tap
  note(f, t, 0.5 + k * 0.5, { gain: 0.26 });
  note(f * 2, t, 0.35, { type: 'triangle', gain: 0.07 + k * 0.08 });
  if (level >= 2) note(f * 1.5, t + 0.03, 0.55, { gain: 0.1 + k * 0.08 });            // a fifth on top
  if (level >= 4) shimmer(t, 0.5, 0.05 + k * 0.05, 7000);
  if (level >= 6) { note(f * 1.25, t + 0.06, 0.7, { gain: 0.1 }); note(f / 2, t, 0.6, { gain: 0.14 }); }
}

/* the last tap: a heartbeat, a rising sparkle arpeggio and a big warm chord */
export function finalSound() {
  if (!audio()) return;
  const t = ctx.currentTime + 0.005;
  [0, 0.17].forEach((d, i) => note(78, t + d, 0.28, { gain: i ? 0.5 : 0.6, to: 42 }));                // lub-dub
  [523.25, 659.25, 783.99, 1046.5, 1318.51, 1567.98, 2093.0].forEach((f, i) => {
    note(f, t + 0.12 + i * 0.07, 0.9, { gain: 0.2 }); note(f * 2, t + 0.12 + i * 0.07, 0.5, { type: 'triangle', gain: 0.05 });
  });
  const c = t + 0.65;                                                                      // the chord everything lands on
  [261.63, 392.0, 523.25, 659.25, 783.99, 1046.5].forEach(f => note(f, c, 2.2, { gain: 0.14 }));
  shimmer(t + 0.1, 1.4, 0.12, 5000); shimmer(c, 1.6, 0.08, 8000);
}
