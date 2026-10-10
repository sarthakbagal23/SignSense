'use client';

import { useEffect, useRef, useState } from 'react';
import { buildHand, lerpParams, poseParams } from '@/pose.js';
import { applyMat, clamp, rotMat } from '@/vec.js';
import { CONSTRAINTS } from '@/letters.js';

// The landing hero draws SignSense's own parametric hand model (the same one that powers the ghost target and demo mode),
// so what a visitor sees is the real landmark skeleton, not an illustration.
const BONES = [[0, 1], [1, 2], [2, 3], [3, 4], [0, 5], [5, 9], [9, 13], [13, 17], [0, 17],
  [5, 6], [6, 7], [7, 8], [9, 10], [10, 11], [11, 12], [13, 14], [14, 15], [15, 16], [17, 18], [18, 19], [19, 20]];
const PALM = [0, 1, 5, 9, 13, 17];
const TIPS = new Set([4, 8, 12, 16, 20]);
const SIGNAL = [95, 212, 224], FROST = [226, 250, 252];
const DUST_N = 170;
const rnd = (i, k) => { const x = Math.sin(i * 127.1 + k * 311.7) * 43758.5453; return x - Math.floor(x); };
const smooth = (k) => k * k * (3 - 2 * k);
const rgba = (c, a) => `rgba(${c[0]},${c[1]},${c[2]},${a})`;
const mix = (a, b, t) => a.map((v, i) => Math.round(v + (b[i] - v) * t));

// The cue a coach would give for this letter: the heaviest critical constraint's "low" message and the landmark it points at.
export function cueFor(letter) {
  const list = (CONSTRAINTS[letter] || []).filter((c) => c.critical && c.low);
  list.sort((a, b) => b.weight - a.weight);
  const c = list[0];
  return c ? { focus: c.focus[0], text: c.low } : { focus: 8, text: '' };
}

/**
 * mode "auto": loops through `letters`, morphing between them with a visible "adjusting" beat, then a "matched" beat.
 * mode "scrub": `progressRef.current` (0..1) drives the morph, so scroll position decides the handshape.
 */
export default function HandStage({ letters, mode = 'auto', progressRef, period = 4.6, pointer = true, className = '', onLetter }) {
  const wrap = useRef(null);
  const canvas = useRef(null);
  const chip = useRef(null);
  const [view, setView] = useState({ letter: letters[0], settled: false });
  const viewRef = useRef(view);
  const cb = useRef(onLetter);
  cb.current = onLetter;

  useEffect(() => {
    const el = canvas.current, box = wrap.current;
    if (!el || !box) return undefined;
    const ctx = el.getContext('2d');
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const n = letters.length;
    let w = 0, h = 0, dpr = 1, raf = 0, visible = true, t0 = performance.now();
    const aim = { x: 0, y: 0 }, cur = { x: 0, y: 0 };
    const dust = Array.from({ length: DUST_N }, (_, i) => ({ bone: Math.floor(rnd(i, 1) * BONES.length), u: rnd(i, 2), a: rnd(i, 3) * 6.283, d: 0.25 + rnd(i, 4) * 0.95, sp: 0.2 + rnd(i, 5) * 0.6, r: 0.6 + rnd(i, 6) * 1.5 }));

    const resize = () => {
      const r = box.getBoundingClientRect();
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      w = r.width; h = r.height;
      el.width = Math.round(w * dpr); el.height = Math.round(h * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };
    const ro = new ResizeObserver(resize); ro.observe(box); resize();
    const io = new IntersectionObserver(([e]) => { visible = e.isIntersecting; }, { threshold: 0.01 }); io.observe(box);
    const onMove = (e) => {
      const r = box.getBoundingClientRect();
      aim.x = clamp(((e.clientX - r.left) / r.width - 0.5) * 2, -1.2, 1.2);
      aim.y = clamp(((e.clientY - r.top) / r.height - 0.5) * 2, -1.2, 1.2);
    };
    if (pointer && !reduce) window.addEventListener('pointermove', onMove, { passive: true });

    const frame = (now) => {
      raf = requestAnimationFrame(frame);
      if (!visible) return;
      const t = reduce ? 0 : Math.max(0, now - t0) / 1000;

      // 1) Which letters are we between, and how far along?
      let a, b, e, settled;
      if (mode === 'scrub') {
        const p = clamp(progressRef?.current ?? 0, 0, 1) * (n - 1);
        const i = Math.min(n - 2, Math.floor(p));
        a = letters[Math.max(0, i)]; b = letters[Math.min(n - 1, i + 1)];
        const k = n === 1 ? 1 : p - i;
        e = smooth(clamp((k - 0.08) / 0.7, 0, 1));
        settled = e < 0.03 || e > 0.97;
      } else {
        const i = Math.floor(t / period) % n, local = t % period;
        a = letters[(i - 1 + n) % n]; b = letters[i];
        e = reduce ? 1 : smooth(clamp((local - 0.25) / 1.5, 0, 1));
        settled = e > 0.995;
      }
      // Scrubbing labels whichever shape is nearer; the auto loop labels the letter it is heading toward.
      const target = e >= 0.5 ? b : a;
      const shown = mode === 'scrub' ? target : b;
      const cue = cueFor(shown);
      if (viewRef.current.letter !== shown || viewRef.current.settled !== settled) {
        viewRef.current = { letter: shown, settled };
        setView(viewRef.current);
        cb.current?.(shown, settled);
      }

      // 2) Build the hand and orient it.
      const P = buildHand(lerpParams(poseParams(a), poseParams(b), e));
      cur.x += (aim.x - cur.x) * 0.06; cur.y += (aim.y - cur.y) * 0.06;
      const R = rotMat(-0.1 + cur.y * 0.22 + Math.sin(t * 0.6) * 0.04, -0.2 + cur.x * 0.36 + Math.sin(t * 0.45) * 0.06, -0.03 + Math.sin(t * 0.35) * 0.025);
      const S = Math.min(w * 0.44, h * 0.34), cx = w * 0.5, cy = h * 0.45 + S * 0.95;
      const pts = P.map((p) => {
        const q = applyMat(R, [p[0] - 0.02, p[1], p[2]]);
        const f = 1 / (1 - q[2] * 0.2);
        return { x: cx + q[0] * S * f, y: cy - q[1] * S * f, z: q[2], f };
      });

      const unit = clamp(w / 520, 0.7, 1.4);
      // The hand dissolves into stardust while it changes shape, then pulls itself back together.
      const chaos = mode === 'scrub' || !settled ? 4 * e * (1 - e) : 0;
      const calm = 1 - chaos * 0.75;
      ctx.clearRect(0, 0, w, h);

      // Soft glow behind the palm
      const gl = ctx.createRadialGradient(cx, cy - S * 0.55, 0, cx, cy - S * 0.55, S * 1.5);
      gl.addColorStop(0, rgba(SIGNAL, 0.2 * calm)); gl.addColorStop(1, rgba(SIGNAL, 0));
      ctx.fillStyle = gl; ctx.fillRect(0, 0, w, h);

      // Palm plate
      ctx.beginPath(); PALM.forEach((k, j) => (j ? ctx.lineTo(pts[k].x, pts[k].y) : ctx.moveTo(pts[k].x, pts[k].y))); ctx.closePath();
      const g = ctx.createLinearGradient(0, cy - S * 1.4, 0, cy);
      g.addColorStop(0, rgba(SIGNAL, 0.02)); g.addColorStop(1, rgba(SIGNAL, 0.13 * calm));
      ctx.fillStyle = g; ctx.fill();

      // Constellation lines, back to front
      const order = BONES.map((bn) => ({ bn, z: (pts[bn[0]].z + pts[bn[1]].z) / 2 })).sort((u, v) => u.z - v.z);
      ctx.lineCap = 'round';
      for (const { bn, z } of order) {
        const near = clamp((z + 0.6) / 1.4, 0, 1);
        ctx.strokeStyle = rgba(mix(SIGNAL, FROST, near * 0.6), (0.2 + near * 0.4) * calm);
        ctx.lineWidth = (1 + near * 1.2) * unit;
        ctx.shadowColor = rgba(SIGNAL, 0.6); ctx.shadowBlur = 8 * calm;
        ctx.beginPath(); ctx.moveTo(pts[bn[0]].x, pts[bn[0]].y); ctx.lineTo(pts[bn[1]].x, pts[bn[1]].y); ctx.stroke();
      }
      ctx.shadowBlur = 0;

      // Stardust: every grain has a home on the hand; chaos lifts it away and swirls it.
      for (let i = 0; i < DUST_N; i++) {
        const d = dust[i], A = pts[BONES[d.bone][0]], B = pts[BONES[d.bone][1]];
        const hx = A.x + (B.x - A.x) * d.u, hy = A.y + (B.y - A.y) * d.u;
        const ang = d.a + t * d.sp, rad = (6 + d.d * 70 * (0.25 + chaos * 1.6)) * unit;
        const x = hx + Math.cos(ang) * rad * (0.3 + chaos), y = hy + Math.sin(ang * 0.9) * rad * (0.3 + chaos) - chaos * 26 * d.d * unit;
        const tw = 0.5 + 0.5 * Math.sin(t * 2 + i);
        ctx.fillStyle = rgba(i % 5 === 0 ? FROST : SIGNAL, (0.35 + 0.55 * tw) * (0.55 + chaos * 0.45));
        ctx.beginPath(); ctx.arc(x, y, d.r * unit * (0.7 + tw * 0.5), 0, 7); ctx.fill();
      }

      // Joints as stars; fingertips get a four-point sparkle
      pts.forEach((p, k) => {
        const near = clamp((p.z + 0.6) / 1.4, 0, 1);
        const tip = TIPS.has(k);
        const r = (tip ? 4.4 : 2.6) * (0.8 + near * 0.5) * unit;
        ctx.shadowColor = rgba(SIGNAL, 0.9); ctx.shadowBlur = (tip ? 18 : 9) * calm;
        ctx.fillStyle = rgba(mix(SIGNAL, FROST, 0.45 + near * 0.55), 0.55 + 0.45 * calm);
        ctx.beginPath(); ctx.arc(p.x, p.y, r, 0, 7); ctx.fill();
        if (tip && calm > 0.5) {
          ctx.shadowBlur = 0; ctx.strokeStyle = rgba(FROST, 0.55 * calm); ctx.lineWidth = 1;
          const L = r * 3.4 * (0.85 + 0.15 * Math.sin(t * 3 + k));
          ctx.beginPath(); ctx.moveTo(p.x - L, p.y); ctx.lineTo(p.x + L, p.y); ctx.moveTo(p.x, p.y - L); ctx.lineTo(p.x, p.y + L); ctx.stroke();
        }
      });
      ctx.shadowBlur = 0;

      // The coaching marker: a breathing ring around the landmark the cue is about.
      const fp = pts[cue.focus] || pts[8];
      const col = settled ? FROST : SIGNAL;
      const pulse = reduce ? 0.5 : (Math.sin(t * 5) + 1) / 2;
      ctx.strokeStyle = rgba(col, 0.95); ctx.lineWidth = 1.6 * unit;
      ctx.setLineDash(settled ? [] : [4 * unit, 5 * unit]);
      ctx.beginPath(); ctx.arc(fp.x, fp.y, (14 + (settled ? 0 : pulse * 5)) * unit, 0, 7); ctx.stroke();
      ctx.setLineDash([]);

      // The cue chip stays put; a thin leader line ties it to the landmark.
      const cEl = chip.current;
      if (cEl) {
        const ax = cEl.offsetLeft + Math.min(36, cEl.offsetWidth / 2), ay = cEl.offsetTop;
        ctx.strokeStyle = rgba(col, 0.4); ctx.lineWidth = 1;
        ctx.setLineDash([2, 5]);
        ctx.beginPath(); ctx.moveTo(fp.x, fp.y + 14 * unit); ctx.lineTo(ax, ay); ctx.stroke();
        ctx.setLineDash([]);
      }
      void target;
    };
    raf = requestAnimationFrame(frame);
    return () => { cancelAnimationFrame(raf); ro.disconnect(); io.disconnect(); window.removeEventListener('pointermove', onMove); };
  }, [letters, mode, period, pointer, progressRef]);

  const cue = cueFor(view.letter);
  return (
    <div ref={wrap} className={`hand-stage ${className}`}>
      <div className="hand-stage-rings" aria-hidden="true"><i /><i /><i /></div>
      <canvas ref={canvas} role="img" aria-label={`Hand made of stars forming the letter ${view.letter}`} />
      <div ref={chip} className={`hand-chip ${view.settled ? 'is-ok' : 'is-fix'}`} aria-live="polite">
        <span className="hand-chip-dot" aria-hidden="true" />
        <span className="hand-chip-text">{view.settled ? `That's ${view.letter}. Hold it.` : cue.text}</span>
      </div>
    </div>
  );
}
