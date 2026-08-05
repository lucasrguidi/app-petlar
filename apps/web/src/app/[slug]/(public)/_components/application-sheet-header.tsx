'use client'

import { Cat, CircleHelp, Heart, Mars, Sparkles, Venus } from 'lucide-react'

import { cn } from '@/lib/utils'

export interface ApplicationSheetCatSummary {
  id: string
  name: string
  sex: 'male' | 'female' | 'unknown'
  ageYears: number | null
  ageMonths: number | null
  photoUrl: string | null
}

interface ApplicationSheetHeaderProps {
  cat: ApplicationSheetCatSummary
  className?: string
}

function formatAge(years: number | null, months: number | null): string {
  if (years && years > 0) {
    if (months && months > 0) {
      return `${years} ano${years > 1 ? 's' : ''} e ${months} ${months > 1 ? 'meses' : 'mês'}`
    }
    return `${years} ano${years > 1 ? 's' : ''}`
  }

  if (months && months > 0) {
    return `${months} ${months > 1 ? 'meses' : 'mês'}`
  }

  return 'Idade não informada'
}

export function ApplicationSheetHeader({
  cat,
  className,
}: ApplicationSheetHeaderProps) {
  return (
    <div
      className={cn(
        'relative overflow-hidden rounded-2xl',
        'bg-gradient-to-br from-white/90 via-white to-muted/25',
        'border border-white/60',
        'p-4 backdrop-blur-sm',
        'shadow-lg shadow-foreground/5',
        'animate-fade-in',
        className
      )}
    >
      {/* Decorative background pattern */}
      <div
        className="pointer-events-none absolute -top-4 -right-4 h-24 w-24 rounded-full bg-gradient-to-br from-primary/10 to-transparent blur-2xl"
        aria-hidden="true"
      />

      <div className="relative flex items-center gap-4">
        {/* Photo with ring and shadow */}
        <div className="relative shrink-0">
          {/* Glow effect behind photo */}
          <div
            className="absolute inset-0 rounded-2xl bg-gradient-to-br from-primary/20 to-muted/30 blur-md"
            aria-hidden="true"
          />

          <div
            className={cn(
              'relative h-20 w-20 overflow-hidden rounded-2xl',
              'ring-4 ring-white/80',
              'shadow-xl shadow-foreground/10',
              'transition-transform duration-300 hover:scale-105'
            )}
          >
            {cat.photoUrl ? (
              <img
                src={cat.photoUrl}
                alt={`Foto de ${cat.name}`}
                className="h-full w-full object-cover"
                loading="lazy"
              />
            ) : (
              <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-muted/40 to-muted/20">
                <Cat className="h-9 w-9 text-muted-foreground/40" />
              </div>
            )}
          </div>

          {/* Small heart badge */}
          <div
            className={cn(
              'absolute -right-1 -bottom-1',
              'flex h-7 w-7 items-center justify-center rounded-full',
              'bg-gradient-to-br from-primary to-accent',
              'ring-2 ring-white',
              'shadow-lg shadow-primary/30'
            )}
          >
            <Heart className="h-3.5 w-3.5 fill-white text-white" />
          </div>
        </div>

        {/* Cat info */}
        <div className="min-w-0 flex-1 space-y-2">
          {/* Name + Status */}
          <div className="flex flex-wrap items-center gap-2">
            <h3
              className="truncate text-xl font-bold text-foreground sm:text-2xl"
              style={{ fontFamily: 'var(--font-display)' }}
            >
              {cat.name}
            </h3>
          </div>

          {/* Tags */}
          <div className="flex flex-wrap items-center gap-2">
            {/* Availability badge with pulse */}
            <span
              className={cn(
                'inline-flex items-center gap-1.5 rounded-full px-2.5 py-1',
                'bg-emerald-500/90 text-xs font-semibold text-white',
                'shadow-md shadow-emerald-500/25',
                'animate-pulse-soft'
              )}
            >
              <Sparkles className="h-3 w-3" />
              Disponível
            </span>

            {/* Sex badge */}
            <span
              className={cn(
                'inline-flex items-center gap-1 rounded-full px-2.5 py-1',
                'text-xs font-medium',
                cat.sex === 'male'
                  ? 'bg-blue-500/15 text-blue-700'
                  : cat.sex === 'female'
                    ? 'bg-pink-500/15 text-pink-700'
                    : 'bg-muted text-muted-foreground'
              )}
            >
              {cat.sex === 'male' ? (
                <Mars className="h-3.5 w-3.5" />
              ) : cat.sex === 'female' ? (
                <Venus className="h-3.5 w-3.5" />
              ) : (
                <CircleHelp className="h-3.5 w-3.5" />
              )}
              {cat.sex === 'male' ? 'Macho' : cat.sex === 'female' ? 'Fêmea' : 'Desconhecido'}
            </span>
          </div>

          {/* Age */}
          <p className="text-sm text-muted-foreground/70">
            {formatAge(cat.ageYears, cat.ageMonths)}
          </p>
        </div>
      </div>

      {/* Encouraging message */}
      <div className="mt-3 rounded-xl bg-primary/5 px-3 py-2">
        <p className="text-center text-xs font-medium text-foreground/80">
          {cat.sex === 'female' ? 'Ela' : 'Ele'} está esperando por você
        </p>
      </div>
    </div>
  )
}
