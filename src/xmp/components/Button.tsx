import { cva, type VariantProps } from 'class-variance-authority';
import { forwardRef, type ButtonHTMLAttributes } from 'react';
import { cn } from '../lib/utils';

const button = cva(
  'inline-flex items-center justify-center gap-2 rounded-md font-medium whitespace-nowrap transition-colors outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1 disabled:pointer-events-none disabled:opacity-50',
  {
    variants: {
      variant: {
        primary: 'bg-primary text-primary-foreground hover:opacity-90',
        outline: 'border border-input bg-card hover:bg-muted',
        soft: 'border border-accent-border bg-card text-accent hover:bg-accent-soft',
        ghost: 'hover:bg-muted',
        danger:
          'border border-[#fec84b] bg-[#fffaeb] text-[#b54708] hover:bg-[#fef0c7]',
      },
      size: {
        sm: 'h-8 px-3 text-[13px]',
        md: 'h-9 px-4 text-sm',
        icon: 'h-8 w-8',
      },
    },
    defaultVariants: { variant: 'outline', size: 'sm' },
  }
);

export interface ButtonProps
  extends ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof button> {}

/**
 * Ref-forwarding is load-bearing, not incidental: Radix's `asChild` triggers
 * (dropdown menu, popover, dialog) attach a ref to their child to measure it. Without
 * forwardRef the floating element never gets a reference to position against and the
 * menu renders off-screen at its pre-measurement transform.
 */
export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, ...props }, ref) => (
    <button ref={ref} className={cn(button({ variant, size }), className)} {...props} />
  )
);
Button.displayName = 'Button';
