import { useEffect, useRef } from 'react';
import { aurora } from '@/fx.js';
import { cn } from '@/lib.js';
// WebGL aurora (shader after React Bits' Aurora, ported to raw WebGL2).
export function Aurora({ stops, amplitude = 0.9, className }) {
  const ref = useRef(null);
  useEffect(() => { const stop = aurora(ref.current, { stops, amplitude }); return () => { stop?.(); ref.current?.querySelector('canvas')?.remove(); }; }, []);
  return <div ref={ref} aria-hidden className={cn('aurora', className)} />;
}
