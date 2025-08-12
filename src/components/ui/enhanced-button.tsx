import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"
import * as React from "react"

import { cn } from "@/utils/cn"

const enhancedButtonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-lg text-sm font-bold transition-all duration-200 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg:not([class*='size-'])]:size-4 shrink-0 [&_svg]:shrink-0 outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-forest-green/50 shadow-sm",
  {
    variants: {
      variant: {
        // Primary button - Forest Green with high contrast white text
        primary: [
          "bg-forest-green text-paper-white shadow-lg",
          "hover:bg-forest-green/90 hover:shadow-xl",
          "active:bg-forest-green/95 active:shadow-md",
          "disabled:bg-stone-gray disabled:text-charcoal/50",
          "focus-visible:ring-forest-green/50"
        ].join(" "),
        
        // Secondary button - Equipment Yellow with dark text for contrast
        secondary: [
          "bg-equipment-yellow text-charcoal shadow-lg",
          "hover:bg-equipment-yellow/90 hover:shadow-xl",
          "active:bg-equipment-yellow/95 active:shadow-md",
          "disabled:bg-stone-gray disabled:text-charcoal/50",
          "focus-visible:ring-equipment-yellow/50"
        ].join(" "),
        
        // Destructive button - Error Red with white text
        destructive: [
          "bg-error-red text-paper-white shadow-lg",
          "hover:bg-error-red/90 hover:shadow-xl",
          "active:bg-error-red/95 active:shadow-md",
          "disabled:bg-stone-gray disabled:text-charcoal/50",
          "focus-visible:ring-error-red/50"
        ].join(" "),
        
        // Outline button - Transparent with border
        outline: [
          "border-2 border-stone-gray bg-paper-white text-charcoal shadow-sm",
          "hover:bg-light-concrete hover:border-charcoal/20 hover:shadow-md",
          "active:bg-stone-gray/20 active:shadow-sm",
          "disabled:bg-stone-gray/10 disabled:border-stone-gray/50 disabled:text-charcoal/50",
          "focus-visible:ring-charcoal/30"
        ].join(" "),
        
        // Outline Primary - Forest Green outline
        "outline-primary": [
          "border-2 border-forest-green bg-paper-white text-forest-green shadow-sm",
          "hover:bg-forest-green hover:text-paper-white hover:shadow-md",
          "active:bg-forest-green/95 active:text-paper-white active:shadow-sm",
          "disabled:bg-stone-gray/10 disabled:border-stone-gray/50 disabled:text-charcoal/50",
          "focus-visible:ring-forest-green/50"
        ].join(" "),
        
        // Outline Destructive - Error Red outline
        "outline-destructive": [
          "border-2 border-error-red bg-paper-white text-error-red shadow-sm",
          "hover:bg-error-red hover:text-paper-white hover:shadow-md",
          "active:bg-error-red/95 active:text-paper-white active:shadow-sm",
          "disabled:bg-stone-gray/10 disabled:border-stone-gray/50 disabled:text-charcoal/50",
          "focus-visible:ring-error-red/50"
        ].join(" "),
        
        // Ghost button - Minimal styling
        ghost: [
          "bg-transparent text-charcoal",
          "hover:bg-light-concrete hover:shadow-sm",
          "active:bg-stone-gray/20",
          "disabled:text-charcoal/50",
          "focus-visible:ring-charcoal/30"
        ].join(" "),
        
        // Link button - Text only
        link: [
          "text-forest-green underline-offset-4 shadow-none",
          "hover:underline hover:text-forest-green/90",
          "active:text-forest-green/95",
          "disabled:text-charcoal/50",
          "focus-visible:ring-forest-green/50"
        ].join(" "),
        
        // Success button - Success Green
        success: [
          "bg-success-green text-paper-white shadow-lg",
          "hover:bg-success-green/90 hover:shadow-xl",
          "active:bg-success-green/95 active:shadow-md",
          "disabled:bg-stone-gray disabled:text-charcoal/50",
          "focus-visible:ring-success-green/50"
        ].join(" "),
      },
      size: {
        sm: "h-8 px-3 py-2 text-xs gap-1.5 rounded-md",
        default: "h-10 px-4 py-2 text-sm gap-2",
        lg: "h-12 px-6 py-3 text-base gap-2 rounded-xl",
        xl: "h-14 px-8 py-4 text-lg gap-3 rounded-xl",
        icon: "size-10 p-0",
        "icon-sm": "size-8 p-0 rounded-md",
        "icon-lg": "size-12 p-0 rounded-xl",
      },
    },
    defaultVariants: {
      variant: "primary",
      size: "default",
    },
  }
)

export interface EnhancedButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof enhancedButtonVariants> {
  asChild?: boolean
}

const EnhancedButton = React.forwardRef<HTMLButtonElement, EnhancedButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button"
    return (
      <Comp
        className={cn(enhancedButtonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    )
  }
)
EnhancedButton.displayName = "EnhancedButton"

export { EnhancedButton, enhancedButtonVariants }
