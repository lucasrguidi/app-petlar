import * as React from "react"

import { cn } from "@/lib/utils"

const Textarea = React.forwardRef<
  HTMLTextAreaElement,
  React.ComponentProps<"textarea">
>(({ className, ...props }, ref) => {
  return (
    <textarea
      className={cn(
        "border-border/60 bg-card ring-offset-background placeholder:text-muted-foreground focus:border-primary focus:ring-primary/20 flex min-h-[80px] w-full rounded-lg border px-3 py-2 text-base transition-colors focus:ring-2 focus:outline-none disabled:cursor-not-allowed disabled:opacity-50 md:text-sm",
        className
      )}
      ref={ref}
      {...props}
    />
  )
})
Textarea.displayName = "Textarea"

export { Textarea }
