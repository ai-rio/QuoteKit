/**
 * Accessible UI Component Overrides
 * WCAG AAA compliant versions of shadcn/ui components
 */

import * as LabelPrimitive from "@radix-ui/react-label";
import * as SelectPrimitive from "@radix-ui/react-select";
import { cva, type VariantProps } from "class-variance-authority";
import { Check, ChevronDown, ChevronUp } from "lucide-react";
import * as React from 'react';

import { cn } from '@/utils/cn';

// Accessible Input Component
export interface AccessibleInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  error?: boolean;
  helperText?: string;
}

const AccessibleInput = React.forwardRef<HTMLInputElement, AccessibleInputProps>(
  ({ className, type, error, helperText, ...props }, ref) => {
    const inputId = props.id || `input-${Math.random().toString(36).substr(2, 9)}`;
    const helperTextId = helperText ? `${inputId}-helper` : undefined;
    
    return (
      <div className="space-y-2">
        <input
          id={inputId}
          type={type}
          className={cn(
            // Base styles with WCAG AAA compliance
            'flex h-12 w-full rounded-lg border-2 px-4 py-3 text-lg font-medium',
            'bg-paper-white text-charcoal placeholder:text-charcoal/60',
            'border-stone-gray hover:border-forest-green/50',
            'transition-all duration-200',
            // Focus styles
            'focus:outline-none focus:border-forest-green focus:ring-2 focus:ring-forest-green/20',
            // Error styles
            error && 'border-error-red focus:border-error-red focus:ring-error-red/20',
            // Disabled styles
            'disabled:cursor-not-allowed disabled:opacity-50 disabled:bg-stone-gray/10',
            className
          )}
          ref={ref}
          aria-describedby={helperTextId}
          aria-invalid={error}
          {...props}
        />
        {helperText && (
          <p 
            id={helperTextId}
            className={cn(
              'text-base leading-relaxed',
              error ? 'text-error-red' : 'text-charcoal/80'
            )}
          >
            {helperText}
          </p>
        )}
      </div>
    );
  }
);
AccessibleInput.displayName = 'AccessibleInput';

// Accessible Label Component
const accessibleLabelVariants = cva(
  "text-lg font-semibold leading-none text-charcoal peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
);

const AccessibleLabel = React.forwardRef<
  React.ElementRef<typeof LabelPrimitive.Root>,
  React.ComponentPropsWithoutRef<typeof LabelPrimitive.Root> &
    VariantProps<typeof accessibleLabelVariants>
>(({ className, ...props }, ref) => (
  <LabelPrimitive.Root
    ref={ref}
    className={cn(accessibleLabelVariants(), className)}
    {...props}
  />
));
AccessibleLabel.displayName = LabelPrimitive.Root.displayName;

// Accessible Select Components
const AccessibleSelect = SelectPrimitive.Root;

const AccessibleSelectGroup = SelectPrimitive.Group;

const AccessibleSelectValue = SelectPrimitive.Value;

const AccessibleSelectTrigger = React.forwardRef<
  React.ElementRef<typeof SelectPrimitive.Trigger>,
  React.ComponentPropsWithoutRef<typeof SelectPrimitive.Trigger>
>(({ className, children, ...props }, ref) => (
  <SelectPrimitive.Trigger
    ref={ref}
    className={cn(
      // Base styles with WCAG AAA compliance
      'flex h-12 w-full items-center justify-between rounded-lg border-2 px-4 py-3',
      'bg-paper-white text-lg font-medium text-charcoal',
      'border-stone-gray hover:border-forest-green/50',
      'transition-all duration-200',
      // Focus styles
      'focus:outline-none focus:border-forest-green focus:ring-2 focus:ring-forest-green/20',
      // Disabled styles
      'disabled:cursor-not-allowed disabled:opacity-50',
      // Placeholder styles
      'data-[placeholder]:text-charcoal/60',
      className
    )}
    {...props}
  >
    {children}
    <SelectPrimitive.Icon asChild>
      <ChevronDown className="h-5 w-5 text-charcoal" />
    </SelectPrimitive.Icon>
  </SelectPrimitive.Trigger>
));
AccessibleSelectTrigger.displayName = SelectPrimitive.Trigger.displayName;

const AccessibleSelectScrollUpButton = React.forwardRef<
  React.ElementRef<typeof SelectPrimitive.ScrollUpButton>,
  React.ComponentPropsWithoutRef<typeof SelectPrimitive.ScrollUpButton>
>(({ className, ...props }, ref) => (
  <SelectPrimitive.ScrollUpButton
    ref={ref}
    className={cn(
      'flex cursor-default items-center justify-center py-1',
      'text-charcoal hover:text-forest-green',
      className
    )}
    {...props}
  >
    <ChevronUp className="h-4 w-4" />
  </SelectPrimitive.ScrollUpButton>
));
AccessibleSelectScrollUpButton.displayName = SelectPrimitive.ScrollUpButton.displayName;

const AccessibleSelectScrollDownButton = React.forwardRef<
  React.ElementRef<typeof SelectPrimitive.ScrollDownButton>,
  React.ComponentPropsWithoutRef<typeof SelectPrimitive.ScrollDownButton>
>(({ className, ...props }, ref) => (
  <SelectPrimitive.ScrollDownButton
    ref={ref}
    className={cn(
      'flex cursor-default items-center justify-center py-1',
      'text-charcoal hover:text-forest-green',
      className
    )}
    {...props}
  >
    <ChevronDown className="h-4 w-4" />
  </SelectPrimitive.ScrollDownButton>
));
AccessibleSelectScrollDownButton.displayName = SelectPrimitive.ScrollDownButton.displayName;

const AccessibleSelectContent = React.forwardRef<
  React.ElementRef<typeof SelectPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof SelectPrimitive.Content>
>(({ className, children, position = "popper", ...props }, ref) => (
  <SelectPrimitive.Portal>
    <SelectPrimitive.Content
      ref={ref}
      className={cn(
        'relative z-50 max-h-96 min-w-[8rem] overflow-hidden rounded-lg border-2',
        'bg-paper-white text-charcoal border-stone-gray shadow-lg',
        'data-[state=open]:animate-in data-[state=closed]:animate-out',
        'data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0',
        'data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95',
        'data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2',
        'data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2',
        position === "popper" &&
          'data-[side=bottom]:translate-y-1 data-[side=left]:-translate-x-1 data-[side=right]:translate-x-1 data-[side=top]:-translate-y-1',
        className
      )}
      position={position}
      {...props}
    >
      <AccessibleSelectScrollUpButton />
      <SelectPrimitive.Viewport
        className={cn(
          'p-2',
          position === "popper" &&
            'h-[var(--radix-select-trigger-height)] w-full min-w-[var(--radix-select-trigger-width)]'
        )}
      >
        {children}
      </SelectPrimitive.Viewport>
      <AccessibleSelectScrollDownButton />
    </SelectPrimitive.Content>
  </SelectPrimitive.Portal>
));
AccessibleSelectContent.displayName = SelectPrimitive.Content.displayName;

const AccessibleSelectLabel = React.forwardRef<
  React.ElementRef<typeof SelectPrimitive.Label>,
  React.ComponentPropsWithoutRef<typeof SelectPrimitive.Label>
>(({ className, ...props }, ref) => (
  <SelectPrimitive.Label
    ref={ref}
    className={cn(
      'py-2 px-3 text-lg font-semibold text-charcoal',
      className
    )}
    {...props}
  />
));
AccessibleSelectLabel.displayName = SelectPrimitive.Label.displayName;

const AccessibleSelectItem = React.forwardRef<
  React.ElementRef<typeof SelectPrimitive.Item>,
  React.ComponentPropsWithoutRef<typeof SelectPrimitive.Item>
>(({ className, children, ...props }, ref) => (
  <SelectPrimitive.Item
    ref={ref}
    className={cn(
      'relative flex w-full cursor-pointer select-none items-center rounded-md py-3 px-3',
      'text-lg text-charcoal outline-none',
      'hover:bg-light-concrete focus:bg-light-concrete',
      'data-[disabled]:pointer-events-none data-[disabled]:opacity-50',
      className
    )}
    {...props}
  >
    <span className="absolute right-3 flex h-4 w-4 items-center justify-center">
      <SelectPrimitive.ItemIndicator>
        <Check className="h-4 w-4 text-forest-green" />
      </SelectPrimitive.ItemIndicator>
    </span>
    <SelectPrimitive.ItemText>{children}</SelectPrimitive.ItemText>
  </SelectPrimitive.Item>
));
AccessibleSelectItem.displayName = SelectPrimitive.Item.displayName;

const AccessibleSelectSeparator = React.forwardRef<
  React.ElementRef<typeof SelectPrimitive.Separator>,
  React.ComponentPropsWithoutRef<typeof SelectPrimitive.Separator>
>(({ className, ...props }, ref) => (
  <SelectPrimitive.Separator
    ref={ref}
    className={cn('-mx-1 my-1 h-px bg-stone-gray/30', className)}
    {...props}
  />
));
AccessibleSelectSeparator.displayName = SelectPrimitive.Separator.displayName;

export {
  AccessibleInput,
  AccessibleLabel,
  AccessibleSelect,
  AccessibleSelectContent,
  AccessibleSelectGroup,
  AccessibleSelectItem,
  AccessibleSelectLabel,
  AccessibleSelectScrollDownButton,
  AccessibleSelectScrollUpButton,
  AccessibleSelectSeparator,
  AccessibleSelectTrigger,
  AccessibleSelectValue,
};
