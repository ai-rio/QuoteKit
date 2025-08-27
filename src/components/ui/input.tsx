import * as React from "react"

import { cn } from "@/utils/cn"

export interface InputProps
  extends React.InputHTMLAttributes<HTMLInputElement> {}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type, ...props }, ref) => {
    return (
      <input
        type={type}
        data-slot="input"
        className={cn(
          "file:text-charcoal placeholder:text-charcoal/60 selection:bg-forest-green selection:text-paper-white bg-paper-white border-stone-gray/40 text-charcoal flex h-10 w-full min-w-0 rounded-md border px-3 py-2 text-base shadow-xs transition-[color,box-shadow,border-color] outline-none file:inline-flex file:h-7 file:border-0 file:bg-transparent file:text-sm file:font-medium disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50 md:text-sm hover:border-stone-gray/60",
          "focus-visible:border-forest-green focus-visible:ring-forest-green/20 focus-visible:ring-[3px] focus-visible:outline-2 focus-visible:outline-forest-green focus-visible:outline-offset-1",
          "aria-invalid:ring-error-red/20 aria-invalid:border-error-red aria-invalid:focus-visible:border-error-red aria-invalid:focus-visible:ring-error-red/20",
          className
        )}
        ref={ref}
        {...props}
      />
    )
  }
)
Input.displayName = "Input"

export { Input }
