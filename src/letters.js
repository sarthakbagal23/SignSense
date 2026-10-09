// Constraint sets (design doc §5). Bands were set from the feature dump of the parametric hand model
// (scripts/selftest.mjs prints it). ⚠ Re-derive lo/hi/tol from REAL captured data and verify every
// handshape against Gallaudet / Lifeprint before trusting it (doc §5.5, §8).
const N = ['index', 'middle', 'ring', 'pinky'];
const K = ['curlI', 'curlM', 'curlR', 'curlP'];
const TIP = [8, 12, 16, 20];

const ext = (f, w = 2) => ({ id: `${N[f]}-straight`, feature: K[f], lo: 0, hi: 0.22, tol: 0.3, weight: w, critical: true, focus: [TIP[f]], label: `${N[f]} straight`, low: '', high: `Straighten your ${N[f]} finger all the way out.` });
const fist = (f, w = 2) => ({ id: `${N[f]}-curled`, feature: K[f], lo: 0.8, hi: 1, tol: 0.3, weight: w, critical: true, focus: [TIP[f]], label: `${N[f]} curled`, low: `Curl your ${N[f]} finger tightly into your palm.`, high: '' });
const curved = (f, lo, hi, w = 1.5) => ({ id: `${N[f]}-curved`, feature: K[f], lo, hi, tol: 0.2, weight: w, critical: false, focus: [TIP[f]], label: `${N[f]} curved`, low: `Bend your ${N[f]} finger a little more.`, high: `Open your ${N[f]} finger up a little.` });
const C = (id, feature, lo, hi, tol, weight, critical, focus, label, low, high) => ({ id, feature, lo, hi, tol, weight, critical, focus, label, low, high });

export const CONSTRAINTS = {
  A: [fist(0), fist(1), fist(2), fist(3),
    C('thumb-beside', 'thumbIndexSide', 0.08, 0.24, 0.14, 3, true, [4, 6, 7], 'thumb beside index', 'Rest your thumb along the side of your index finger.', 'Bring your thumb in so it rests alongside your index finger.'),
    C('thumb-snug', 'thumbSide', -0.16, 0.14, 0.12, 1, false, [4], 'thumb snug', 'Bring your thumb in against your fist.', 'Tuck your thumb in against your fist.')],
  S: [fist(0), fist(1), fist(2), fist(3),
    C('thumb-across', 'thumbSN', 0.08, 0.32, 0.08, 3, true, [4], 'thumb across front', 'Wrap your thumb across the front of your curled fingers.', 'Lower your thumb so it lies over your fingers.')],
  B: [ext(0), ext(1), ext(2), ext(3),
    C('fingers-together', 'spreadIM', 0, 9, 10, 1, false, [8, 12], 'fingers together', '', 'Press your fingers together.'),
    C('thumb-folded', 'thumbSide', -0.6, -0.1, 0.2, 3, true, [4], 'thumb folded', 'Fold your thumb across the middle of your palm.', 'Fold your thumb in across your palm.')],
  C: [curved(0, 0.3, 0.58), curved(1, 0.3, 0.58), curved(2, 0.3, 0.58), curved(3, 0.3, 0.58),
    C('c-gap', 'dTI', 0.4, 0.85, 0.2, 3, true, [4, 8], 'open C gap', 'Open the gap between your thumb and fingers a little.', 'Close the gap between your thumb and fingers a little.')],
  D: [ext(0), curved(1, 0.55, 0.92, 2), curved(2, 0.55, 0.92, 1.5), curved(3, 0.55, 0.92, 1.5),
    C('thumb-touch-middle', 'dTM', 0, 0.15, 0.2, 3, true, [4, 12], 'thumb on middle', 'Touch your thumb tip to your middle fingertip.', 'Touch your thumb tip to your middle fingertip.')],
  I: [fist(0), fist(1), fist(2), ext(3),
    C('thumb-over', 'thumbSide', -0.38, -0.04, 0.14, 1.5, false, [4], 'thumb over fingers', 'Cross your thumb over your curled fingers.', 'Tuck your thumb in over your curled fingers.')],
  L: [ext(0), fist(1), fist(2), fist(3),
    C('thumb-out', 'thumbSide', 0.4, 1.0, 0.25, 3, true, [4], 'thumb out', 'Stick your thumb out to the side, making an L.', '')],
  O: [curved(0, 0.55, 0.92), curved(1, 0.55, 0.92), curved(2, 0.55, 0.92), curved(3, 0.55, 0.92),
    C('close-circle', 'dTI', 0, 0.12, 0.2, 3, true, [4, 8], 'circle closed', 'Touch your thumb tip to your index fingertip to close the circle.', 'Touch your thumb tip to your index fingertip to close the circle.')],
  U: [ext(0), ext(1), fist(2), fist(3),
    C('together', 'spreadIM', 0, 10, 8, 3, true, [8, 12], 'index+middle together', '', 'Squeeze your index and middle fingers together.'),
    C('thumb-ring', 'dTR', 0, 0.3, 0.3, 1.5, false, [4], 'thumb on ring finger', 'Rest your thumb over your ring finger.', 'Rest your thumb over your ring finger.')],
  V: [ext(0), ext(1), fist(2), fist(3),
    C('spread', 'spreadIM', 18, 45, 10, 3, true, [8, 12], 'fingers spread', 'Spread your index and middle fingers apart into a V.', 'Bring your two fingers in a little, a V, not a wide split.'),
    C('thumb-ring', 'dTR', 0, 0.3, 0.3, 1.5, false, [4], 'thumb on ring finger', 'Rest your thumb over your ring finger.', 'Rest your thumb over your ring finger.')],
  W: [ext(0), ext(1), ext(2), fist(3),
    C('spread-im', 'spreadIM', 8, 30, 8, 2, true, [8, 12], 'fingers fanned', 'Fan your three fingers apart.', 'Bring your fingers in a little.'),
    C('spread-mr', 'spreadMR', 8, 30, 8, 2, true, [12, 16], 'fingers fanned', 'Fan your three fingers apart.', 'Bring your fingers in a little.'),
    C('thumb-pinky', 'dTP', 0, 0.2, 0.25, 2, true, [4, 20], 'thumb on pinky', 'Tuck your thumb over your pinky.', 'Tuck your thumb over your pinky.')],
  F: [C('index-hook', 'curlI', 0.4, 0.85, 0.2, 2, true, [8], 'index curled to thumb', 'Curl your index finger down to meet your thumb.', 'Ease your index finger up a little.'), ext(1), ext(2), ext(3),
    C('ok-circle', 'dTI', 0, 0.16, 0.2, 3, true, [4, 8], 'thumb meets index', 'Touch your thumb tip to your index fingertip.', 'Touch your thumb tip to your index fingertip.')],
  K: [ext(0), ext(1), fist(2), fist(3),
    C('k-spread', 'spreadIM', 6, 26, 8, 2, true, [8, 12], 'fingers apart a little', 'Open your index and middle fingers slightly.', 'Bring your two fingers a little closer.'),
    C('thumb-flat', 'thumbSN', -0.12, 0.14, 0.1, 3, true, [4], 'thumb beside middle finger', 'Rest your thumb against the side of your middle finger, not across your ring finger.', 'Rest your thumb against the side of your middle finger.'),
    C('thumb-off-ring', 'dTR', 0.25, 1.2, 0.2, 1.5, false, [4, 16], 'thumb off ring finger', 'Move your thumb off your ring finger and up toward your middle finger.', '')],
  X: [C('hook', 'curlI', 0.38, 0.75, 0.15, 3, true, [8], 'index hooked', 'Bend your index finger into a hook.', 'Straighten your index finger a bit more, hooked, not tight.'), fist(1), fist(2), fist(3),
    C('thumb-beside', 'thumbSN', -0.1, 0.1, 0.1, 1, false, [4], 'thumb tucked', 'Tuck your thumb in against your fist.', 'Tuck your thumb in against your fist.')],
  Y: [fist(0), fist(1), fist(2), ext(3),
    C('thumb-out', 'thumbSide', 0.4, 1.0, 0.25, 3, true, [4], 'thumb out', 'Stick your thumb out to the side.', '')],
};

// Confusable-pair tie-breakers (doc §5.3): the single most discriminative feature for each pair.
export const TIEBREAK = [
  { pair: ['A', 'S'], feature: 'thumbSN', threshold: 0.055, high: 'S', msg: 'Between A and S: check whether your thumb is beside your fist (A) or across the front (S).' },
  { pair: ['U', 'V'], feature: 'spreadIM', threshold: 14, high: 'V', msg: 'Between U and V: how far apart are your index and middle fingers?' },
  { pair: ['K', 'V'], feature: 'thumbSN', threshold: 0.17, high: 'V', msg: 'Between K and V: is your thumb resting on your middle finger (K) or on your ring finger (V)?' },
  { pair: ['D', 'O'], feature: 'dTM', threshold: 0.2, high: 'O', msg: 'Between D and O: is your index finger straight (D) or curved to meet your thumb (O)?' },
];
export const DESCRIPTIONS = {
  A: 'Fist, thumb resting beside the index finger', B: 'Flat hand, thumb folded across the palm', C: 'Curved hand, like holding a cup',
  D: 'Index up, other fingers circle to touch thumb', I: 'Pinky up, fist, thumb over fingers', L: 'Index up, thumb out, an L',
  O: 'Fingers curve to meet the thumb in a circle', S: 'Fist, thumb wrapped across the front', U: 'Index and middle up, together',
  V: 'Index and middle up, spread apart', W: 'Three fingers up and fanned, thumb on pinky', Y: 'Thumb and pinky out, others curled',
  F: 'Thumb and index make a circle, other three fingers up', K: 'Index and middle up in a V, thumb resting on the middle finger', X: 'Index finger bent like a hook, other fingers in a fist',
};
export const CURRICULUM = ['A', 'S', 'A', 'S', 'L', 'D', 'U', 'V', 'U', 'V', 'W', 'B', 'C', 'O', 'C', 'O', 'I', 'Y', 'I', 'Y', 'F', 'B', 'F', 'K', 'V', 'K', 'X', 'A', 'X'];
