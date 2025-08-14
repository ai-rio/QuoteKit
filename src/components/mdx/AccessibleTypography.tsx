/**
 * Accessible Typography Components
 * WCAG AAA compliant typography components for blog content
 */

import React from 'react';

import { cn } from '@/utils/cn';

interface AccessibleLinkProps {
  href?: string;
  children: React.ReactNode;
  className?: string;
  variant?: 'default' | 'subtle' | 'emphasis';
}

/**
 * WCAG AAA compliant link component
 * - 7:1 contrast ratio minimum
 * - Clear focus indicators
 * - Proper hover states
 */
export function AccessibleLink({ 
  href, 
  children, 
  className,
  variant = 'default' 
}: AccessibleLinkProps) {
  const baseClasses = "underline transition-colors duration-200 font-medium";
  
  const variantClasses = {
    default: "text-forest-green hover:text-charcoal focus:text-charcoal",
    subtle: "text-charcoal hover:text-forest-green focus:text-forest-green", 
    emphasis: "text-charcoal hover:text-forest-green focus:text-forest-green font-semibold"
  };

  const focusClasses = "focus:outline-2 focus:outline-forest-green focus:outline-offset-2";

  return (
    <a 
      href={href}
      className={cn(
        baseClasses,
        variantClasses[variant],
        focusClasses,
        className
      )}
      target={href?.startsWith('http') ? '_blank' : undefined}
      rel={href?.startsWith('http') ? 'noopener noreferrer' : undefined}
    >
      {children}
    </a>
  );
}

interface AccessibleHeadingProps {
  level: 1 | 2 | 3 | 4 | 5 | 6;
  children: React.ReactNode;
  className?: string;
  id?: string;
}

/**
 * Accessible heading component with proper contrast and hierarchy
 */
export function AccessibleHeading({ 
  level, 
  children, 
  className,
  id 
}: AccessibleHeadingProps) {
  const Tag = `h${level}` as keyof JSX.IntrinsicElements;
  
  const baseClasses = "font-black text-forest-green";
  
  const sizeClasses = {
    1: "text-4xl md:text-6xl mb-8 mt-12 first:mt-0",
    2: "text-3xl md:text-4xl mb-6 mt-10", 
    3: "text-xl md:text-2xl font-bold mb-4 mt-8",
    4: "text-lg md:text-xl font-bold mb-3 mt-6",
    5: "text-base md:text-lg font-bold mb-2 mt-4",
    6: "text-sm md:text-base font-bold mb-2 mt-4"
  };

  return (
    <Tag 
      id={id}
      className={cn(
        baseClasses,
        sizeClasses[level],
        className
      )}
    >
      {children}
    </Tag>
  );
}

interface AccessibleTextProps {
  children: React.ReactNode;
  className?: string;
  variant?: 'body' | 'large' | 'small' | 'caption';
  emphasis?: 'normal' | 'medium' | 'strong';
}

/**
 * Accessible text component with proper contrast
 */
export function AccessibleText({ 
  children, 
  className,
  variant = 'body',
  emphasis = 'normal'
}: AccessibleTextProps) {
  const baseClasses = "text-charcoal leading-relaxed";
  
  const variantClasses = {
    body: "text-lg mb-6",
    large: "text-xl mb-6", 
    small: "text-base mb-4",
    caption: "text-sm mb-2"
  };

  const emphasisClasses = {
    normal: "font-normal",
    medium: "font-medium", 
    strong: "font-bold"
  };

  return (
    <p className={cn(
      baseClasses,
      variantClasses[variant],
      emphasisClasses[emphasis],
      className
    )}>
      {children}
    </p>
  );
}

interface AccessibleCalloutProps {
  children: React.ReactNode;
  type?: 'info' | 'warning' | 'success' | 'error' | 'tip';
  className?: string;
}

/**
 * Accessible callout component with proper contrast and semantic meaning
 */
export function AccessibleCallout({ 
  children, 
  type = 'info',
  className 
}: AccessibleCalloutProps) {
  const baseClasses = "p-6 rounded-2xl border-l-4 mb-6";
  
  const typeClasses = {
    info: "bg-light-concrete border-info-blue text-charcoal",
    warning: "bg-light-concrete border-equipment-yellow text-charcoal", 
    success: "bg-light-concrete border-success-green text-charcoal",
    error: "bg-light-concrete border-error-red text-charcoal",
    tip: "bg-light-concrete border-forest-green text-charcoal"
  };

  const icons = {
    info: "ℹ️",
    warning: "⚠️",
    success: "✅", 
    error: "❌",
    tip: "💡"
  };

  return (
    <div 
      className={cn(baseClasses, typeClasses[type], className)}
      role="note"
      aria-label={`${type} callout`}
    >
      <div className="flex items-start gap-3">
        <span className="text-xl flex-shrink-0 mt-0.5" aria-hidden="true">
          {icons[type]}
        </span>
        <div className="flex-1">
          {children}
        </div>
      </div>
    </div>
  );
}

/**
 * Skip link for keyboard navigation
 */
export function SkipLink({ href = "#main-content" }: { href?: string }) {
  return (
    <a
      href={href}
      className="
        sr-only 
        focus:not-sr-only 
        focus:absolute 
        focus:top-4 
        focus:left-4 
        focus:z-50
        bg-charcoal 
        text-paper-white 
        px-4 
        py-2 
        rounded-lg
        font-medium
        focus:outline-2
        focus:outline-equipment-yellow
        focus:outline-offset-2
      "
    >
      Skip to main content
    </a>
  );
}
