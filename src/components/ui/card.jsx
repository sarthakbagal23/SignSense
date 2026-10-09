import { cn } from '@/lib.js';
export const Card = ({ className, spot = true, ...p }) => <div className={cn('rounded-2xl border border-hair bg-surface p-4', spot && 'spot', className)} {...p} />;
export const CardTitle = ({ className, ...p }) => <h3 className={cn('mb-2 font-mono text-[10.5px] font-bold uppercase tracking-[0.14em] text-sub [&_small]:ml-1.5 [&_small]:font-medium [&_small]:normal-case [&_small]:tracking-normal [&_small]:opacity-75', className)} {...p} />;
