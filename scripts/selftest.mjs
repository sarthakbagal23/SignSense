// Synthetic regression suite: random 3D rotation, scale, landmark noise, both handedness conventions.
// ⚠ Synthetic data validates the PIPELINE (frame math, mirroring, constraints, tie-breaks). It does not
// replace tests on real captured hands.
import { buildLetter, LETTER_SET } from '../src/pose.js';
import { toPalmFrame, computeFeatures } from '../src/geometry.js';
import { classify, scoreLetter } from '../src/engine.js';
import { rotMat, applyMat, mulberry32 } from '../src/vec.js';

export function synthWorld(P, rnd, { noise = 0.012, tilt = 0.45, mirrored = true } = {}) {
  const R = rotMat((rnd() - 0.5) * tilt * 2, (rnd() - 0.5) * tilt * 2, (rnd() - 0.5) * 1.2);
  const s = 0.085 + rnd() * 0.03;
  return P.map((p) => {
    const q = applyMat(R, [p[0] + (rnd() - 0.5) * 2 * noise, p[1] + (rnd() - 0.5) * 2 * noise, p[2] + (rnd() - 0.5) * 2 * noise * 1.6]);
    return { x: q[0] * s, y: -q[1] * s, z: q[2] * s }; // y flipped => MediaPipe-style (also flips chirality)
  });
}

const rnd = mulberry32(2026);
const N = 25;
let ok = 0, total = 0;
const confusion = {};
console.log('letter  acc   mean score (own)');
for (const L of LETTER_SET) {
  let hit = 0, sc = 0;
  for (let i = 0; i < N; i++) {
    const w = synthWorld(buildLetter(L), rnd);
    const fr = toPalmFrame(w, true, {}, 1);
    const res = classify(computeFeatures(fr.pts, fr));
    sc += scoreLetter(L, computeFeatures(fr.pts, fr)).score;
    total++;
    if (res.top.letter === L) { hit++; ok++; } else (confusion[`${L}->${res.top.letter}`] = (confusion[`${L}->${res.top.letter}`] || 0) + 1);
  }
  console.log(`  ${L}    ${(100 * hit / N).toFixed(0).padStart(3)}%   ${(sc / N).toFixed(2)}`);
}
console.log(`overall: ${ok}/${total} = ${(100 * ok / total).toFixed(1)}%`, Object.keys(confusion).length ? 'confusions: ' + JSON.stringify(confusion) : '');

// Mirror-invariance: a mirrored copy of the same hand + mirror flag must give identical features.
{
  const P = buildLetter('S');
  const a = computeFeatures(...(() => { const f = toPalmFrame(P.map((p) => ({ x: p[0], y: p[1], z: p[2] })), false, {}, 1); return [f.pts, f]; })());
  const b = computeFeatures(...(() => { const f = toPalmFrame(P.map((p) => ({ x: -p[0], y: p[1], z: p[2] })), true, {}, 1); return [f.pts, f]; })());
  const d = Math.max(...Object.keys(a).filter((k) => !['pointUp', 'palmFacing'].includes(k)).map((k) => Math.abs(a[k] - b[k])));
  console.log(`mirror invariance: max feature diff ${d.toExponential(1)} ${d < 1e-9 ? 'PASS' : 'FAIL'}`);
}
// Rotation-invariance of shape features.
{
  const P = buildLetter('V'); const r2 = mulberry32(5);
  const f0 = computeFeatures(...(() => { const f = toPalmFrame(P.map((p) => ({ x: p[0], y: -p[1], z: p[2] })), true, {}, 1); return [f.pts, f]; })());
  let worst = 0;
  for (let i = 0; i < 50; i++) { const w = synthWorld(P, r2, { noise: 0 }); const f = toPalmFrame(w, true, {}, 1); const F = computeFeatures(f.pts, f); worst = Math.max(worst, Math.abs(F.spreadIM - f0.spreadIM), Math.abs(F.curlI - f0.curlI) * 100); }
  console.log(`rotation invariance (50 random poses): worst diff ${worst.toExponential(1)} ${worst < 1e-6 ? 'PASS' : 'FAIL'}`);
}

// Noise sweep: how fast does accuracy degrade as landmark jitter grows? (σ in palm-length units)
{
  console.log('noise sweep (σ → accuracy):');
  for (const noise of [0.02, 0.04, 0.06, 0.08]) {
    const r = mulberry32(99); let hit = 0, tot = 0;
    for (const L of LETTER_SET) for (let i = 0; i < 40; i++) {
      const w = synthWorld(buildLetter(L), r, { noise });
      const f = toPalmFrame(w, true, {}, 1);
      if (classify(computeFeatures(f.pts, f)).top.letter === L) hit++; tot++;
    }
    console.log(`  σ=${noise.toFixed(2)}  ${(100 * hit / tot).toFixed(1)}%`);
  }
}
