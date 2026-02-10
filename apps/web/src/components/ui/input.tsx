import * as React from 'react'

import { cn } from '@/lib/utils'

const Input = React.forwardRef<HTMLInputElement, React.ComponentProps<'input'>>(
  ({ className, type, ...props }, ref) => {
    return (
      <input
        type={type}
        className={cn(
          'border-border/60 bg-card ring-offset-background file:text-foreground placeholder:text-muted-foreground focus:border-primary focus:ring-primary/20 flex h-10 w-full rounded-lg border px-3 py-2 text-base transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium focus:ring-2 focus:outline-none disabled:cursor-not-allowed disabled:opacity-50 md:text-sm',
          className
        )}
        ref={ref}
        {...props}
      />
    )
  }
)
Input.displayName = 'Input'

export { Input }
