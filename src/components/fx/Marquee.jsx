import { cn } from '@/lib.js';
export function Marquee({ children, className, speed = 38 }) {
  return (
    <div className={cn('marquee group overflow-hidden', className)} style={{ '--speed': `${speed}s` }}>
      <div className="marquee-track flex w-max gap-3 group-hover:[animation-play-state:paused]">
        <div className="flex gap-3">{children}</div><div className="flex gap-3" aria-hidden>{children}</div>
      </div>
    </div>
  );
}
