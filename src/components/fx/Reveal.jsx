import { motion } from 'motion/react';
export function Reveal({ children, delay = 0, y = 28, className, as = 'div' }) {
  const M = motion[as]; const calm = typeof matchMedia !== 'undefined' && matchMedia('(prefers-reduced-motion: reduce)').matches;
  return <M className={className} initial={calm ? false : { opacity: 0, y }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, margin: '-12% 0px' }} transition={{ duration: 0.8, delay, ease: [0.2, 0.8, 0.2, 1] }}>{children}</M>;
}
