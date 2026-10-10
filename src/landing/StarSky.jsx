'use client';

import { useEffect, useRef } from 'react';

// One night sky behind the whole page. Three star layers drift at different speeds with scroll and pointer (parallax),
// a few shooting stars cross now and then, and slow aurora light sits underneath. Single hue: signal teal.
export default function StarSky() {
  const ref = useRef(null);
  useEffect(() => {
    const el = ref.current;
    const ctx = el.getContext('2d');
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    let w = 0, h = 0, dpr = 1, raf = 0, scroll = 0, px = 0, py = 0, tx = 0, ty = 0;
    let stars = [];
    const shooters = [];
    const resize = () => {
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      w = window.innerWidth; h = window.innerHeight;
      el.width = Math.round(w * dpr); el.height = Math.round(h * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      const n = Math.round(Math.min(260, (w * h) / 6500));
      stars = Array.from({ length: n }, (_, i) => {
        const layer = i % 3;
        return { x: Math.random() * w, y: Math.random() * h, z: layer, r: [0.6, 1, 1.5][layer] * (0.7 + Math.random() * 0.6), ph: Math.random() * 6.28, sp: 0.6 + Math.random() * 1.6 };
      });
    };
    const onScroll = () => { scroll = window.scrollY; };
    const onMove = (e) => { tx = e.clientX / w - 0.5; ty = e.clientY / h - 0.5; };
    resize(); onScroll();
    window.addEventListener('resize', resize);
    window.addEventListener('scroll', onScroll, { passive: true });
    if (!reduce) window.addEventListener('pointermove', onMove, { passive: true });
    let last = performance.now(), nextShoot = last + 2500;
    const frame = (now) => {
      raf = requestAnimationFrame(frame);
      const dt = Math.min(0.05, (now - last) / 1000); last = now;
      px += (tx - px) * 0.04; py += (ty - py) * 0.04;
      ctx.clearRect(0, 0, w, h);
      for (const s of stars) {
        const k = (s.z + 1) * 0.5;
        const x = (((s.x - px * 28 * k) % w) + w) % w;
        const y = (((s.y - scroll * 0.05 * k - py * 28 * k) % h) + h) % h;
        const tw = reduce ? 0.8 : 0.55 + 0.45 * Math.sin(now / 1000 * s.sp + s.ph);
        ctx.fillStyle = `rgba(${s.z === 2 ? '226,250,252' : '160,230,238'},${(0.25 + s.z * 0.22) * tw + 0.1})`;
        ctx.beginPath(); ctx.arc(x, y, s.r, 0, 7); ctx.fill();
        if (s.z === 2) { ctx.fillStyle = `rgba(95,212,224,${0.06 * tw})`; ctx.beginPath(); ctx.arc(x, y, s.r * 4, 0, 7); ctx.fill(); }
      }
      if (!reduce) {
        if (now > nextShoot) { shooters.push({ x: Math.random() * w * 0.8 + w * 0.2, y: Math.random() * h * 0.4, l: 0 }); nextShoot = now + 5000 + Math.random() * 6000; }
        for (let i = shooters.length - 1; i >= 0; i--) {
          const m = shooters[i]; m.l += dt * 1.1; m.x -= dt * 620; m.y += dt * 260;
          const a = Math.sin(Math.min(1, m.l) * Math.PI);
          const g = ctx.createLinearGradient(m.x, m.y, m.x + 150, m.y - 62);
          g.addColorStop(0, `rgba(226,250,252,${a})`); g.addColorStop(1, 'rgba(95,212,224,0)');
          ctx.strokeStyle = g; ctx.lineWidth = 1.6; ctx.beginPath(); ctx.moveTo(m.x, m.y); ctx.lineTo(m.x + 150, m.y - 62); ctx.stroke();
          if (m.l >= 1) shooters.splice(i, 1);
        }
      }
    };
    raf = requestAnimationFrame(frame);
    return () => { cancelAnimationFrame(raf); window.removeEventListener('resize', resize); window.removeEventListener('scroll', onScroll); window.removeEventListener('pointermove', onMove); };
  }, []);
  return (
    <div className="sky" aria-hidden="true">
      <i className="sky-aurora a1" /><i className="sky-aurora a2" /><i className="sky-aurora a3" />
      <canvas ref={ref} />
    </div>
  );
}
