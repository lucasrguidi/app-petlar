'use client'

import type { ReactNode } from 'react'

import { cn } from '@/lib/utils'

interface ApplicationFormCardProps {
  title?: string
  description?: string
  children: ReactNode
  className?: string
}

export function ApplicationFormCard({
  title,
  description,
  children,
  className,
}: ApplicationFormCardProps) {
  return (
    <div
      className={cn(
        'rounded-2xl p-5 sm:p-6',
        'bg-white/90 backdrop-blur-sm',
        'border border-white/60',
        'shadow-lg shadow-[#783201]/5',
        className
      )}
    >
      {(title || description) && (
        <div className="mb-5">
          {title && (
            <h2
              className="text-xl font-bold text-[#783201]"
              style={{ fontFamily: 'var(--font-display)' }}
            >
              {title}
            </h2>
          )}
          {description && (
            <p className="mt-1 text-sm text-[#8B5A2B]/70">{description}</p>
          )}
        </div>
      )}
      {children}
    </div>
  )
}
