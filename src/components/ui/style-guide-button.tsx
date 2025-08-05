import * as React from 'react';

import { cn } from '@/utils/cn';

interface StyleGuideButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'standard' | 'outline';
  size?: 'sm' | 'default' | 'lg';
  children: React.ReactNode;
}

/**
 * Button component that strictly follows the LawnQuote Style Guide
 * 
 * Variants:
 * - primary: Equipment Yellow CTA for most important actions
 * - secondary: Ghost style for secondary actions  
 * - standard: Forest Green for standard form submissions
 * - outline: White/outline style for general use
 */
export const StyleGuideButton = React.forwardRef<HTMLButtonElement, StyleGuideButtonProps>(
  ({ className, variant = 'standard', size = 'default', children, ...props }, ref) => {
    const baseClasses = 'inline-flex items-center justify-center gap-2 font-bold transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-offset-2';
    
    const variantClasses = {
      primary: 'bg-equipment-yellow text-charcoal hover:brightness-110 shadow-lg hover:shadow-xl focus:ring-equipment-yellow/50',
      secondary: 'bg-paper-white/20 text-paper-white hover:bg-paper-white/30 focus:ring-paper-white/50',
      standard: 'bg-forest-green text-paper-white hover:opacity-90 focus:ring-forest-green/50',
      outline: 'bg-paper-white border border-stone-gray text-charcoal hover:bg-light-concrete focus:ring-forest-green/50'
    };

    const sizeClasses = {
      sm: 'px-4 py-2 text-sm rounded-lg',
      default: 'px-6 py-3 text-base rounded-lg',
      lg: 'px-8 py-4 text-lg rounded-lg'
    };

    return (
      <button
        ref={ref}
        className={cn(
          baseClasses,
          variantClasses[variant],
          sizeClasses[size],
          className
        )}
        {...props}
      >
        {children}
      </button>
    );
  }
);

StyleGuideButton.displayName = 'StyleGuideButton';
