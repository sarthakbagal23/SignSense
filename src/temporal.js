// Temporal layer (doc §6): score smoothing, hysteresis (0.80 in / 0.65 out), hold timer, coach rate limit.
export class ScoreSmoother {
  constructor(alpha = 0.45) { this.a = alpha; this.v = {}; }
  push(ranked) { for (const r of ranked) this.v[r.letter] = this.v[r.letter] == null ? r.score : this.v[r.letter] + this.a * (r.score - this.v[r.letter]); return this.v; }
  reset() { this.v = {}; }
}
export class Hysteresis {
  constructor(hi = 0.8, lo = 0.65) { this.hi = hi; this.lo = lo; this.on = false; }
  update(s) { this.on = this.on ? s >= this.lo : s >= this.hi; return this.on; }
  reset() { this.on = false; }
}
export class Coach {
  constructor(minHold = 900) { this.min = minHold; this.cur = null; this.since = 0; }
  update(now, cand) {
    if (!this.cur || cand.kind === 'ok' !== (this.cur.kind === 'ok') || (cand.key !== this.cur.key && now - this.since > this.min)) { this.cur = cand; this.since = now; }
    return this.cur;
  }
}
