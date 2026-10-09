// Recognition engine (doc §5): trapezoidal membership -> weighted geometric mean -> ranked letters,
// tie-breakers, and one-correction-at-a-time feedback. Classification and feedback share one mechanism.
import { CONSTRAINTS, TIEBREAK } from './letters.js';
import { LETTER_SET } from './pose.js';

export const ACCEPT = 0.75;
export function satisfy(x, lo, hi, tol) {
  if (x >= lo && x <= hi) return 1;
  const d = x < lo ? lo - x : x - hi;
  return Math.max(0, 1 - d / tol);
}

export function scoreLetter(letter, F, tolScale = 1) {
  const cs = CONSTRAINTS[letter];
  let sl = 0, sw = 0, critOk = true;
  const parts = cs.map((c) => {
    const x = F[c.feature];
    const s = satisfy(x, c.lo, c.hi, c.tol * tolScale);
    sl += c.weight * Math.log(Math.max(s, 0.01)); sw += c.weight;
    if (c.critical && s < 0.5) critOk = false;
    return { c, x, s, dir: x < c.lo ? 'low' : x > c.hi ? 'high' : 'ok' };
  });
  const score = Math.exp(sl / sw);
  return { letter, score, parts, accepted: score >= ACCEPT && critOk };
}

export function classify(F, tolScale = 1, set = LETTER_SET) {
  const ranked = set.map((l) => scoreLetter(l, F, tolScale)).sort((a, b) => b.score - a.score);
  let ambiguous = null;
  const [a, b] = ranked;
  if (a && b && a.score - b.score < 0.08) {
    const tb = TIEBREAK.find((t) => t.pair.includes(a.letter) && t.pair.includes(b.letter));
    if (tb) {
      const other = tb.pair.find((x) => x !== tb.high);
      const win = F[tb.feature] > tb.threshold ? tb.high : other;
      if (win !== a.letter) { ranked[0] = b; ranked[1] = a; }
      ambiguous = { pair: tb.pair, msg: tb.msg };
    } else ambiguous = { pair: [a.letter, b.letter], msg: `Reading this as somewhere between ${a.letter} and ${b.letter}.` };
  }
  return { ranked, top: ranked[0], ambiguous };
}

// Rank failing constraints of the target by weight × (1 − satisfaction); surface only the worst.
export function feedback(res) {
  // Coach only when a constraint is clearly outside its useful range. The previous
  // 0.85 cut-off turned harmless landmark jitter near an edge into repeated corrections.
  const fails = res.parts.filter((p) => p.s < 0.65).sort((a, b) => b.c.weight * (1 - b.s) - a.c.weight * (1 - a.s));
  const w = fails[0];
  if (!w) return null;
  const msg = (w.dir === 'low' ? w.c.low : w.c.high) || w.c.low || w.c.high || `Adjust your ${w.c.label}.`;
  return { part: w, msg, key: w.c.id + w.dir };
}
