import { motion } from 'motion/react';
import { useState } from 'react';
import { cn } from '@/lib.js';
// Floating pill nav; a soft highlight follows the hovered item (after Vengeance UI's Spotlight Navbar).
export function SpotlightNavbar({ brand, items, cta }) {
  const [hover, setHover] = useState(null);
  return (
    <header className="fixed inset-x-0 top-3 z-30 flex justify-center px-3">
      <nav className="flex items-center gap-1 rounded-full border border-hair2 bg-canvas/70 p-1.5 pl-4 shadow-[0_10px_40px_-10px_rgba(0,0,0,.8)] backdrop-blur-xl" onMouseLeave={() => setHover(null)} aria-label="Primary">
        <a href="#top" className="mr-2 flex items-center gap-2 no-underline">{brand}</a>
        <ul className="m-0 hidden list-none items-center gap-0.5 p-0 md:flex">
          {items.map((it) => (
            <li key={it.href} className="relative" onMouseEnter={() => setHover(it.href)}>
              {hover === it.href && <motion.span layoutId="nav-spot" className="absolute inset-0 rounded-full bg-white/10" transition={{ type: 'spring', stiffness: 500, damping: 38 }} />}
              <a href={it.href} className={cn('relative block rounded-full px-3.5 py-1.5 text-sm text-sub no-underline transition-colors hover:text-ink')}>{it.label}</a>
            </li>
          ))}
        </ul>
        {cta}
      </nav>
    </header>
  );
}
