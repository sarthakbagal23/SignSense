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
const SIGNAL = [95, 212, 224], FROST = [232, 238, 245], AMBER = [240, 185, 90], LEAF = [143, 227, 136];
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
      const S = Math.min(w * 0.37, h * 0.3), cx = w * 0.5, cy = h * 0.47 + S * 0.95;
      const pts = P.map((p) => {
        const q = applyMat(R, [p[0] - 0.02, p[1], p[2]]);
        const f = 1 / (1 - q[2] * 0.2);
        return { x: cx + q[0] * S * f, y: cy - q[1] * S * f, z: q[2], f };
      });

      ctx.clearRect(0, 0, w, h);
      // Palm plate
      ctx.beginPath(); PALM.forEach((k, j) => (j ? ctx.lineTo(pts[k].x, pts[k].y) : ctx.moveTo(pts[k].x, pts[k].y))); ctx.closePath();
      const g = ctx.createLinearGradient(0, cy - S * 1.4, 0, cy);
      g.addColorStop(0, rgba(SIGNAL, 0.02)); g.addColorStop(1, rgba(SIGNAL, 0.16));
      ctx.fillStyle = g; ctx.fill();

      // Bones, back to front so near bones sit on top
      const order = BONES.map((bn, i) => ({ bn, z: (pts[bn[0]].z + pts[bn[1]].z) / 2 })).sort((u, v) => u.z - v.z);
      ctx.lineCap = 'round';
      for (const { bn, z } of order) {
        const near = clamp((z + 0.6) / 1.4, 0, 1);
        const col = mix(SIGNAL, FROST, near * 0.55);
        ctx.strokeStyle = rgba(col, 0.35 + near * 0.6);
        ctx.lineWidth = (1.6 + near * 2.2) * clamp(w / 520, 0.7, 1.4);
        ctx.shadowColor = rgba(SIGNAL, 0.55); ctx.shadowBlur = 10 + near * 12;
        ctx.beginPath(); ctx.moveTo(pts[bn[0]].x, pts[bn[0]].y); ctx.lineTo(pts[bn[1]].x, pts[bn[1]].y); ctx.stroke();
      }
      ctx.shadowBlur = 0;

      // Joints
      const unit = clamp(w / 520, 0.7, 1.4);
      pts.forEach((p, k) => {
        const near = clamp((p.z + 0.6) / 1.4, 0, 1);
        const r = (TIPS.has(k) ? 5.2 : 3.2) * (0.8 + near * 0.5) * unit;
        ctx.fillStyle = k === 0 ? rgba(FROST, 0.95) : rgba(mix(SIGNAL, FROST, 0.3 + near * 0.6), 0.95);
        ctx.beginPath(); ctx.arc(p.x, p.y, r, 0, 7); ctx.fill();
      });

      // The coaching marker: amber while the shape is still moving into place, leaf green once it matches.
      const fp = pts[cue.focus] || pts[8];
      const col = settled ? LEAF : AMBER;
      const pulse = reduce ? 0.5 : (Math.sin(t * 5) + 1) / 2;
      ctx.strokeStyle = rgba(col, 0.95); ctx.lineWidth = 2 * unit;
      ctx.setLineDash(settled ? [] : [5 * unit, 5 * unit]);
      ctx.beginPath(); ctx.arc(fp.x, fp.y, (13 + (settled ? 0 : pulse * 4)) * unit, 0, 7); ctx.stroke();
      ctx.setLineDash([]);
      ctx.fillStyle = rgba(col, 1); ctx.beginPath(); ctx.arc(fp.x, fp.y, 4.2 * unit, 0, 7); ctx.fill();

      // The cue chip stays put (so it never covers the hand); a thin leader line ties it to the landmark it is about.
      const cEl = chip.current;
      if (cEl) {
        const ax = cEl.offsetLeft + Math.min(36, cEl.offsetWidth / 2), ay = cEl.offsetTop;
        ctx.strokeStyle = rgba(col, 0.55); ctx.lineWidth = 1.25;
        ctx.setLineDash([3, 4]);
        ctx.beginPath(); ctx.moveTo(fp.x, fp.y + 13 * unit); ctx.lineTo(ax, ay); ctx.stroke();
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
      <canvas ref={canvas} role="img" aria-label={`Hand tracking skeleton forming the letter ${view.letter}`} />
      <div ref={chip} className={`hand-chip ${view.settled ? 'is-ok' : 'is-fix'}`} aria-live="polite">
        <span className="hand-chip-dot" aria-hidden="true" />
        <span className="hand-chip-text">{view.settled ? `That's ${view.letter}. Hold it.` : cue.text}</span>
      </div>
    </div>
  );
}
