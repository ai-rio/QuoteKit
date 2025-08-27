import * as React from "react"

import { cn } from "@/utils/cn"

const Textarea = React.forwardRef<
  HTMLTextAreaElement,
  React.ComponentProps<"textarea">
>(({ className, ...props }, ref) => {
  return (
    <textarea
      data-slot="textarea"
      className={cn(
        "border-stone-gray/40 placeholder:text-charcoal/60 focus-visible:border-forest-green focus-visible:ring-forest-green/20 aria-invalid:ring-error-red/20 aria-invalid:border-error-red bg-paper-white text-charcoal flex field-sizing-content min-h-20 w-full rounded-md border px-3 py-2 text-base shadow-xs transition-[color,box-shadow,border-color] outline-none focus-visible:ring-[3px] focus-visible:outline-2 focus-visible:outline-forest-green focus-visible:outline-offset-1 disabled:cursor-not-allowed disabled:opacity-50 md:text-sm hover:border-stone-gray/60",
        className
      )}
      ref={ref}
      {...props}
    />
  )
})
Textarea.displayName = "Textarea"

export { Textarea }
