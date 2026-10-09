import { motion, useInView } from 'motion/react';
import { useRef } from 'react';
import { cn } from '@/lib.js';
// Letters flip in one by one (in the spirit of Vengeance UI's Flip Text).
export function FlipText({ text, className, delay = 0, stagger = 0.045 }) {
  const ref = useRef(null); const inView = useInView(ref, { once: true, margin: '-15% 0px' });
  const calm = typeof matchMedia !== 'undefined' && matchMedia('(prefers-reduced-motion: reduce)').matches;
  return (
    <span ref={ref} className={cn('inline-block [perspective:600px]', className)} aria-label={text}>
      {[...text].map((c, i) => (
        <motion.span key={i} aria-hidden className="inline-block origin-bottom whitespace-pre"
          initial={calm ? false : { rotateX: -90, opacity: 0, y: 12 }} animate={inView || calm ? { rotateX: 0, opacity: 1, y: 0 } : undefined}
          transition={{ duration: 0.6, delay: delay + i * stagger, ease: [0.2, 0.8, 0.2, 1] }}>{c}</motion.span>
      ))}
    </span>
  );
}
