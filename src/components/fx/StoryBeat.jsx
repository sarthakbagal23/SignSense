import { motion, useScroll, useTransform } from 'motion/react';
import { useRef } from 'react';
import { cn } from '@/lib.js';
// A line of the story comes into focus as it nears the middle of the screen, then softens as it leaves.
export function StoryBeat({ children, small }) {
  const ref = useRef(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ['start 0.95', 'end 0.05'] });
  const opacity = useTransform(scrollYProgress, [0, 0.3, 0.6, 1], [0.1, 1, 1, 0.15]);
  const y = useTransform(scrollYProgress, [0, 0.3], [30, 0]);
  const calm = typeof matchMedia !== 'undefined' && matchMedia('(prefers-reduced-motion: reduce)').matches;
  return (
    <motion.p ref={ref} style={calm ? undefined : { opacity, y }}
      className={cn('m-0 flex items-start text-ink', small ? 'max-w-[34em] font-sans text-[clamp(16px,1.6vw,19px)] leading-[1.55] text-mute' : 'max-w-[26ch] font-display text-[clamp(22px,2.6vw,32px)] leading-[1.2] tracking-[-0.02em]')}>
      <span>{children}</span>
    </motion.p>
  );
}
