// Geometry layer (design doc §4): handedness mirror -> translate -> scale -> PCA palm plane
// -> palm frame, then shape features. DOM-free so it can run in Node for the self-test.
import { sub, add, mul, dot, cross, len, norm, dist, angleBetween, clamp, deg, mix3 } from './vec.js';

export const FINGERS = [[5, 6, 7, 8], [9, 10, 11, 12], [13, 14, 15, 16], [17, 18, 19, 20]];
export const FINGER_NAMES = ['index', 'middle', 'ring', 'pinky'];

// ---- 3x3 symmetric eigendecomposition (cyclic Jacobi). Hand-written on purpose (doc §4.2). ----
export function eigenSym3(m) {
  const a = m.map((r) => r.slice());
  const v = [[1, 0, 0], [0, 1, 0], [0, 0, 1]];
  for (let sweep = 0; sweep < 32; sweep++) {
    let p = 0, q = 1, max = Math.abs(a[0][1]);
    if (Math.abs(a[0][2]) > max) { p = 0; q = 2; max = Math.abs(a[0][2]); }
    if (Math.abs(a[1][2]) > max) { p = 1; q = 2; max = Math.abs(a[1][2]); }
    if (max < 1e-14) break;
    const theta = (a[q][q] - a[p][p]) / (2 * a[p][q]);
    const t = Math.sign(theta || 1) / (Math.abs(theta) + Math.sqrt(theta * theta + 1));
    const c = 1 / Math.sqrt(t * t + 1), s = t * c;
    for (let k = 0; k < 3; k++) { const x = a[k][p], y = a[k][q]; a[k][p] = c * x - s * y; a[k][q] = s * x + c * y; }
    for (let k = 0; k < 3; k++) { const x = a[p][k], y = a[q][k]; a[p][k] = c * x - s * y; a[q][k] = s * x + c * y; }
    for (let k = 0; k < 3; k++) { const x = v[k][p], y = v[k][q]; v[k][p] = c * x - s * y; v[k][q] = s * x + c * y; }
  }
  return { values: [a[0][0], a[1][1], a[2][2]], vectors: [0, 1, 2].map((i) => [v[0][i], v[1][i], v[2][i]]) };
}

const PALM_IDS = [0, 1, 5, 9, 13, 17];

/**
 * world: 21 {x,y,z} MediaPipe worldLandmarks. mirror: negate x BEFORE building the frame (doc §4.1).
 * st: persistent smoothing state ({basis}). Returns palm-frame points (wrist-origin, unit = wrist->middle-MCP)
 * plus the world-frame basis (u = hand "up", v = toward pinky, w = palm normal).
 */
export function toPalmFrame(world, mirror, st = {}, alpha = 0.55) {
  let P = world.map((p) => [mirror ? -p.x : p.x, p.y, p.z]);
  const wrist = P[0];
  P = P.map((p) => sub(p, wrist));
  const scale = len(P[9]) || 1;
  P = P.map((p) => mul(p, 1 / scale));

  // PCA plane over {0,1,5,9,13,17}; normal = eigenvector of the smallest eigenvalue.
  const pp = PALM_IDS.map((i) => P[i]);
  const c = mul(pp.reduce((s, p) => add(s, p), [0, 0, 0]), 1 / pp.length);
  const cov = [[0, 0, 0], [0, 0, 0], [0, 0, 0]];
  for (const p of pp) { const d = sub(p, c); for (let i = 0; i < 3; i++) for (let j = 0; j < 3; j++) cov[i][j] += (d[i] * d[j]) / pp.length; }
  const eig = eigenSym3(cov);
  let imin = 0;
  for (let i = 1; i < 3; i++) if (eig.values[i] < eig.values[imin]) imin = i;
  let w = norm(eig.vectors[imin]);
  const u0 = norm(P[9]);
  let u = norm(sub(u0, mul(w, dot(u0, w))));
  // Chirality rule: orient w so that v = u x w points from the index side toward the pinky side.
  let v = cross(u, w);
  if (dot(v, sub(P[17], P[5])) < 0) { w = mul(w, -1); v = cross(u, w); }

  // Smooth the basis with an EMA, then re-orthonormalise (Gram-Schmidt).
  if (st.basis) {
    v = norm(mix3(st.basis.v, v, alpha));
    u = norm(mix3(st.basis.u, u, alpha));
    u = norm(sub(u, mul(v, dot(u, v))));
    w = cross(v, u);
  }
  st.basis = { u, v, w };
  const pts = P.map((p) => [dot(p, v), dot(p, u), dot(p, w)]);
  return { pts, u, v, w, scale, worldMirrored: P };
}

// ---- Shape features (doc §4.3) + orientation features (doc §4.4) ----
export function computeFeatures(P, frame) {
  const F = {};
  const curls = FINGERS.map(([m, p, d]) => {
    const aM = angleBetween(sub(P[0], P[m]), sub(P[p], P[m])); // interior angle at MCP
    const aP = angleBetween(sub(P[m], P[p]), sub(P[d], P[p])); // interior angle at PIP
    // Doc formula is 1-(aM+aP)/(2π); real interior angles bottom out near 90°, so rescale to reach ~1 on a fist.
    return clamp((2 * Math.PI - (aM + aP)) / (1.1 * Math.PI), 0, 1);
  });
  F.curlI = curls[0]; F.curlM = curls[1]; F.curlR = curls[2]; F.curlP = curls[3];
  F.curlMean = (curls[0] + curls[1] + curls[2] + curls[3]) / 4;

  const dirs = FINGERS.map(([m, , , t]) => [P[t][0] - P[m][0], P[t][1] - P[m][1], 0]);
  F.spreadIM = deg(angleBetween(dirs[0], dirs[1]));
  F.spreadMR = deg(angleBetween(dirs[1], dirs[2]));
  F.spreadRP = deg(angleBetween(dirs[2], dirs[3]));

  const T = P[4];
  F.thumbSide = P[5][0] - T[0];                                   // how far the thumb sticks out to the thumb side
  F.thumbSN = T[2] - (P[6][2] + P[10][2]) / 2;                    // signed normal: beside (≈0) vs in front (>0)
  F.thumbIndexSide = Math.min(dist(T, P[6]), dist(T, P[7]));       // thumb tip beside the index proximal/intermediate phalanx
  F.dTI = dist(T, P[8]); F.dTM = dist(T, P[12]); F.dTR = dist(T, P[16]); F.dTP = dist(T, P[20]);
  F.tipSide = (P[8][2] + P[12][2] + P[16][2] + P[20][2]) / 4;     // used for handedness self-calibration

  if (frame) { // world-frame orientation (never rotation-normalised)
    F.pointUp = -frame.u[1];       // +1: fingers point to the ceiling (MediaPipe world y is down)
    F.palmFacing = -frame.w[2];    // sign tells whether the palm faces the camera
  }
  return F;
}

export const FEATURE_LABELS = {
  curlI: 'curl · index', curlM: 'curl · middle', curlR: 'curl · ring', curlP: 'curl · pinky',
  spreadIM: 'spread · idx-mid °', spreadMR: 'spread · mid-ring °', spreadRP: 'spread · ring-pinky °',
  thumbSide: 'thumb out', thumbSN: 'thumb signed-normal', thumbIndexSide: 'thumb→index side', dTI: 'thumb→index tip', dTM: 'thumb→middle tip',
  dTR: 'thumb→ring tip', dTP: 'thumb→pinky tip', pointUp: 'pointing up', palmFacing: 'palm→camera',
};
