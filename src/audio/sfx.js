let ctx = null, muted = false;
const ensure = () => { try { ctx ||= new (window.AudioContext || window.webkitAudioContext)(); ctx.state === 'suspended' && ctx.resume(); } catch { /* no audio */ } return ctx; };
function tone(freq, t0, dur, type = 'sine', gain = 0.06) {
  const c = ensure(); if (!c || muted) return;
  const o = c.createOscillator(), g = c.createGain();
  o.type = type; o.frequency.value = freq;
  g.gain.setValueAtTime(0, c.currentTime + t0);
  g.gain.linearRampToValueAtTime(gain, c.currentTime + t0 + 0.012);
  g.gain.exponentialRampToValueAtTime(0.0001, c.currentTime + t0 + dur);
  o.connect(g).connect(c.destination); o.start(c.currentTime + t0); o.stop(c.currentTime + t0 + dur + 0.05);
}
export const sfx = {
  unlock: ensure,
  setMuted: (m) => { muted = m; },
  /** rising major arpeggio; `step` climbs a combo ladder */
  success(step = 0) { const base = 523.25 * 2 ** (Math.min(step, 7) / 12 * 2); [0, 4, 7, 12].forEach((n, i) => tone(base * 2 ** (n / 12), i * 0.065, 0.28, 'triangle')); },
  lock() { tone(880, 0, 0.09, 'sine', 0.035); },
  done() { [0, 4, 7, 12, 16].forEach((n, i) => tone(523.25 * 2 ** (n / 12), i * 0.09, 0.4, 'triangle', 0.07)); },
};
