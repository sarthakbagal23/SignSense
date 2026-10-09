import { cva } from 'class-variance-authority';
import { cn } from '@/lib.js';

// shadcn-style button. `.on` state (set imperatively by the tracking core) is styled via the legacy components layer.
export const buttonVariants = cva(
  'inline-flex items-center justify-center gap-2 rounded-[10px] font-semibold transition-[transform,border-color,background-color] duration-200 disabled:opacity-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-signal cursor-pointer no-underline',
  { variants: {
      variant: {
        default: 'bg-ink text-canvas border border-transparent hover:-translate-y-px hover:brightness-110',
        secondary: 'bg-surface2 text-ink border border-hair hover:border-signal',
        ghost: 'bg-transparent text-mute border border-transparent hover:text-ink hover:bg-surface2',
        outline: 'bg-transparent text-ink border border-hair2 hover:border-signal',
      },
      size: { sm: 'min-h-[34px] px-3 text-xs', md: 'min-h-[40px] px-4 text-sm', lg: 'min-h-[48px] px-6 text-[15px]', icon: 'size-10' },
    }, defaultVariants: { variant: 'secondary', size: 'md' } });

export function Button({ className, variant, size, asChild, as: As = 'button', ...props }) {
  return <As className={cn(buttonVariants({ variant, size }), className)} {...props} />;
}
