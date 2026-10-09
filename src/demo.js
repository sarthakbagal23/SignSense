// Synthetic "ghost user": performs the target letter with a deliberate mistake first, then fixes it.
// Same landmarks → same pipeline as a real camera, so the whole UI can be shown with no camera at all.
import { poseParams, lerpParams, buildHand } from './pose.js';
import { rotMat, applyMat, mulberry32, clamp } from './vec.js';

const NEIGH = { A: 'S', S: 'A', B: 'W', C: 'O', D: 'O', I: 'Y', L: 'D', O: 'C', U: 'V', V: 'U', W: 'V', Y: 'I', F: 'K', K: 'F', X: 'A' };
export class DemoHand {
  constructor() { this.rnd = mulberry32(11); this.t = 0; this.phase = 0; this.target = 'A'; }
  setTarget(l) { if (l !== this.target) { this.target = l; this.phase = 0; } }
  step(dt) { this.t += dt; this.phase += dt; }
  sample(aspect = 16 / 9) {
    const T = poseParams(this.target), M = poseParams(NEIGH[this.target] || 'A');
    const k = clamp((this.phase - 2.6) / 1.0, 0, 1), e = k * k * (3 - 2 * k);
    const P = buildHand(lerpParams(M, T, e));
    const t = this.t, R = rotMat(0.22 * Math.sin(t * 0.7), 0.28 * Math.sin(t * 0.5 + 1), 0.3 * Math.sin(t * 0.4));
    const cx = 0.45 + 0.07 * Math.sin(t * 0.35), cy = 0.8 + 0.02 * Math.cos(t * 0.5), k2 = 0.5;
    const landmarks = [], world = [];
    for (const p of P) {
      const j = () => (this.rnd() - 0.5) * 0.008;
      const q = applyMat(R, [p[0] + j(), p[1] + j(), p[2] + j()]);
      landmarks.push({ x: cx + (q[0] * k2) / aspect, y: cy - q[1] * k2, z: q[2] * 0.1 });
      world.push({ x: q[0] * 0.095, y: -q[1] * 0.095, z: q[2] * 0.095 });
    }
    return { landmarks, world, label: 'Left', conf: 0.97 };
  }
}
