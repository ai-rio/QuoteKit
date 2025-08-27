import { Slot } from '@radix-ui/react-slot';
import { cva, type VariantProps } from 'class-variance-authority';
import * as React from 'react';

import { cn } from '@/utils/cn';

import { SexyBoarder } from '../sexy-boarder';

const buttonVariants = cva(
  'w-fit inline-flex items-center justify-center whitespace-nowrap text-sm rounded-md font-alt font-medium transition-colors disabled:pointer-events-none disabled:opacity-50 focus-visible:ring-2 focus-visible:ring-forest-green focus-visible:ring-offset-2',
  {
    variants: {
      variant: {
        default: 'bg-forest-green text-paper-white hover:bg-forest-green/90 focus-visible:bg-forest-green/90',
        destructive: 'bg-error-red text-paper-white hover:bg-error-red/90 focus-visible:bg-error-red/90',
        outline: 'border-2 border-charcoal bg-paper-white text-charcoal hover:bg-charcoal hover:text-paper-white focus-visible:bg-charcoal focus-visible:text-paper-white',
        secondary: 'bg-stone-gray/20 text-charcoal border-2 border-stone-gray/30 hover:bg-stone-gray/30 hover:border-stone-gray/50 focus-visible:bg-stone-gray/30',
        ghost: 'text-charcoal hover:bg-stone-gray/10 hover:text-forest-green focus-visible:bg-stone-gray/20 focus-visible:text-forest-green',
        link: 'text-forest-green underline-offset-4 hover:underline focus-visible:text-forest-green/80',
        orange: 'bg-orange-600 text-paper-white hover:bg-orange-700 focus-visible:bg-orange-700',
        sexy: 'transition-all bg-charcoal text-paper-white hover:bg-forest-green focus-visible:bg-forest-green',
      },
      size: {
        default: 'h-10 px-4',
        sm: 'h-8 rounded-md px-3 text-xs',
        lg: 'h-10 rounded-md px-8',
        icon: 'h-9 w-9',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'default',
    },
  }
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : 'button';
    return (
      <WithSexyBorder variant={variant} className={cn('w-fit', className)}>
        <Comp className={cn(buttonVariants({ variant, size, className }))} ref={ref} {...props} />
      </WithSexyBorder>
    );
  }
);
Button.displayName = 'Button';

export function WithSexyBorder({
  variant,
  className,
  children,
}: {
  variant: string | null | undefined;
  className?: string;
  children: React.ReactNode;
}) {
  if (variant === 'sexy') {
    return <SexyBoarder className={className}>{children}</SexyBoarder>;
  } else {
    return <>{children}</>;
  }
}

export { Button, buttonVariants };
