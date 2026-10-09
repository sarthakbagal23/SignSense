import { cn } from '@/lib.js';
// Soft light rays that sweep slowly (inspired by Vengeance UI's Animated Rays). Pure CSS, GPU friendly.
export function AnimatedRays({ className }) {
  return (
    <div aria-hidden className={cn('pointer-events-none absolute inset-0 overflow-hidden', className)}>
      {[0, 1, 2, 3, 4].map((i) => (
        <span key={i} className="rays-beam" style={{ '--r': `${-28 + i * 14}deg`, '--d': `${7 + i * 1.7}s`, '--o': 0.16 - i * 0.015, left: `${18 + i * 16}%` }} />
      ))}
    </div>
  );
}
