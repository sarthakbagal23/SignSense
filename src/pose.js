// Parametric hand model (DOM-free). It powers: the ghost target hand, demo mode, and the synthetic
// regression suite. Canonical frame: x toward pinky, y toward fingertips, z out of the palm (curl direction).
import { add, sub, mul, dist, rad, lerp, mulberry32, clamp } from './vec.js';

const MCP = [[-0.38, 0.97, 0], [-0.13, 1.0, 0], [0.12, 0.95, 0], [0.36, 0.85, 0]];
const BONES = [[0.43, 0.26, 0.21], [0.48, 0.30, 0.22], [0.44, 0.28, 0.21], [0.35, 0.20, 0.18]];
const CMC = [-0.22, 0.22, 0.02];
const THUMB_LEN = [0.32, 0.27, 0.22];
export const LETTER_SET = ['A', 'B', 'C', 'D', 'I', 'L', 'O', 'S', 'U', 'V', 'W', 'Y', 'F', 'K', 'X'];

const SPEC = {
  A: { curl: [1, 1, 1, 1], abd: [0, 0, 0, 0], thumb: [[20, 25], [5, 35], [0, 38]] },
  S: { curl: [1, 1, 1, 1], abd: [0, 0, 0, 0], thumb: [[10, 35], [-20, 55], [-45, 45]] },
  B: { curl: [0, 0, 0, 0], abd: [-2, 0, 1, 2], thumb: [[15, 30], [-45, 50], [-75, 45]] },
  C: { curl: [0.45, 0.45, 0.45, 0.45], abd: [-3, 0, 2, 4], thumb: [[45, 15], [30, 35], [10, 50]] },
  D: { curl: [0, 0.8, 0.8, 0.8], abd: [0, 0, 0, 0], touch: ['midTip', [0, 0, 0.02]] },
  I: { curl: [1, 1, 1, 0], abd: [0, 0, 0, 0], touch: ['midTip', [0, 0, 0.09]] },
  L: { curl: [0, 1, 1, 1], abd: [0, 0, 0, 0], thumb: [[55, 5], [80, 8], [88, 8]] },
  O: { curl: [0.78, 0.78, 0.78, 0.78], abd: [0, 0, 0, 0], touch: ['idxTip', [0, 0, 0.0]] },
  U: { curl: [0, 0, 1, 1], abd: [-2, 2, 0, 0], touch: ['ringTip', [0, 0, 0.07]] },
  V: { curl: [0, 0, 1, 1], abd: [-14, 13, 0, 0], touch: ['ringTip', [0, 0, 0.07]] },
  W: { curl: [0, 0, 0, 1], abd: [-13, 0, 13, 0], touch: ['pinkyTip', [0, 0, 0.03]] },
  F: { curl: [0.62, 0, 0, 0], abd: [0, -2, 3, 7], touch: ['idxTip', [0, 0, 0.0]] },
  K: { curl: [0, 0, 1, 1], abd: [-6, 6, 0, 0], touch: ['midTip', [0, -0.5, 0.06]] },
  X: { curl: [0.58, 1, 1, 1], abd: [0, 0, 0, 0], thumb: [[20, 25], [5, 35], [0, 38]] },
  Y: { curl: [1, 1, 1, 0], abd: [0, 0, 0, 12], thumb: [[55, 5], [80, 8], [88, 8]] },
};

function thumbChain(dirs) {
  const pts = [CMC]; let p = CMC;
  dirs.forEach(([az, el], i) => {
    const a = rad(az), e = rad(el);
    p = add(p, mul([-Math.sin(a) * Math.cos(e), Math.cos(a) * Math.cos(e), Math.sin(e)], THUMB_LEN[i]));
    pts.push(p);
  });
  return pts;
}

function fingers(curl, abd, P) {
  for (let f = 0; f < 4; f++) {
    const base = 5 + 4 * f; let p = MCP[f]; P[base] = p;
    const a = rad(abd[f]), d = [Math.sin(a), Math.cos(a), 0], c = curl[f];
    let cum = 0;
    [85 * c, 100 * c, 65 * c].forEach((deg, s) => {
      cum += rad(deg);
      p = add(p, mul([d[0] * Math.cos(cum), d[1] * Math.cos(cum), Math.sin(cum)], BONES[f][s]));
      P[base + 1 + s] = p;
    });
  }
}

// Deterministic hill-climb IK: find thumb segment angles whose tip reaches `target`.
function solveThumb(target, init) {
  const rnd = mulberry32(7);
  const err = (d) => { const t = thumbChain(d)[3]; return dist(t, target) ** 2 + 2e-6 * d.reduce((s, [a, e], i) => s + (a - init[i][0]) ** 2 + (e - init[i][1]) ** 2, 0); };
  let best = init.map((x) => x.slice()), be = err(best), step = 24;
  for (let it = 0; it < 4000; it++) {
    const cand = best.map(([a, e]) => [clamp(a + (rnd() - 0.5) * step, -110, 110), clamp(e + (rnd() - 0.5) * step, -10, 78)]);
    const ce = err(cand);
    if (ce < be) { best = cand; be = ce; }
    step = Math.max(0.5, step * 0.9985);
  }
  return best;
}

const CACHE = {};
// Resolve a letter to explicit parameters {curl, abd, thumb:[[az,el]x3]} (IK-solved where needed).
export function poseParams(letter) {
  if (CACHE[letter]) return CACHE[letter];
  const s = SPEC[letter];
  let thumb = s.thumb;
  if (!thumb) {
    const P = new Array(21); fingers(s.curl, s.abd, P);
    const tip = { idxTip: P[8], midTip: P[12], ringTip: P[16], pinkyTip: P[20] }[s.touch[0]];
    thumb = solveThumb(add(tip, s.touch[1]), [[20, 30], [-20, 45], [-45, 40]]);
  }
  return (CACHE[letter] = { curl: s.curl.slice(), abd: s.abd.slice(), thumb: thumb.map((x) => x.slice()) });
}

export function lerpParams(a, b, t) {
  return {
    curl: a.curl.map((x, i) => lerp(x, b.curl[i], t)),
    abd: a.abd.map((x, i) => lerp(x, b.abd[i], t)),
    thumb: a.thumb.map((x, i) => [lerp(x[0], b.thumb[i][0], t), lerp(x[1], b.thumb[i][1], t)]),
  };
}

// 21 canonical palm-frame landmarks for a parameter set.
export function buildHand(params) {
  const P = new Array(21); P[0] = [0, 0, 0];
  thumbChain(params.thumb).forEach((p, i) => { P[1 + i] = p; });
  fingers(params.curl, params.abd, P);
  return P;
}
export const buildLetter = (letter) => buildHand(poseParams(letter));
