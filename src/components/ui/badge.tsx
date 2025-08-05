import { cva, type VariantProps } from "class-variance-authority"
import * as React from "react"

import { cn } from "@/utils/cn"

const badgeVariants = cva(
  "inline-flex items-center justify-center rounded-full px-2 py-1 sm:px-3 sm:py-1 text-xs sm:text-sm font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-forest-green focus:ring-offset-1 sm:focus:ring-offset-2 touch-manipulation select-none whitespace-nowrap",
  {
    variants: {
      variant: {
        default:
          "bg-success-green text-paper-white",
        secondary:
          "bg-stone-gray text-charcoal",
        destructive:
          "bg-error-red text-paper-white",
        outline: "border border-stone-gray text-charcoal bg-paper-white",
        active:
          "bg-success-green text-paper-white",
        archived:
          "bg-stone-gray text-charcoal",
      },
      size: {
        default: "px-2 py-1 sm:px-3 sm:py-1 text-xs sm:text-sm",
        sm: "px-1.5 py-0.5 sm:px-2 sm:py-1 text-xs",
        lg: "px-3 py-1.5 sm:px-4 sm:py-2 text-sm sm:text-base",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {
  size?: "default" | "sm" | "lg"
}

function Badge({ className, variant, size, ...props }: BadgeProps) {
  return (
    <div className={cn(badgeVariants({ variant, size }), className)} {...props} />
  )
}

export { Badge, badgeVariants }
