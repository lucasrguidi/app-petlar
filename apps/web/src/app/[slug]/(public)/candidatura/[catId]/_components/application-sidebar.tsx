'use client'

import { Cat, Heart, Lightbulb, Mars, Sparkles, Venus } from 'lucide-react'

import { cn } from '@/lib/utils'

interface CatSummary {
  id: string
  name: string
  sex: 'male' | 'female'
  ageYears: number | null
  ageMonths: number | null
  photoUrl: string | null
}

interface ApplicationSidebarProps {
  cat: CatSummary
  variant: 'compact' | 'full'
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

function CatInfoCard({
  cat,
  variant,
}: {
  cat: CatSummary
  variant: 'compact' | 'full'
}) {
  const isCompact = variant === 'compact'

  return (
    <div
      className={cn(
        'overflow-hidden rounded-2xl',
        'bg-white/95 backdrop-blur-sm',
        'shadow-lg shadow-foreground/5',
        'border border-white/60'
      )}
    >
      {/* Photo section */}
      <div
        className={cn(
          'relative overflow-hidden',
          'bg-gradient-to-br from-background/30 to-white',
          isCompact ? 'h-24' : 'aspect-square'
        )}
      >
        {cat.photoUrl ? (
          <>
            {/* Blurred background */}
            <img
              src={cat.photoUrl}
              alt=""
              aria-hidden
              className="pointer-events-none absolute inset-0 h-full w-full scale-110 object-cover opacity-30 blur-xl"
              loading="lazy"
            />
            {/* Main photo */}
            <img
              src={cat.photoUrl}
              alt={`Foto de ${cat.name}`}
              className={cn(
                'relative z-0 h-full w-full',
                isCompact ? 'object-cover' : 'object-contain object-center'
              )}
              loading="lazy"
            />
          </>
        ) : (
          <div className="flex h-full items-center justify-center">
            <Cat className="h-12 w-12 text-muted-foreground/30" />
          </div>
        )}

        {/* Availability badge */}
        <div
          className={cn(
            'absolute top-3 left-3 z-20',
            'inline-flex items-center gap-1.5 rounded-full px-2.5 py-1',
            'bg-emerald-500/90 backdrop-blur-sm',
            'shadow-md shadow-emerald-500/25'
          )}
        >
          <Sparkles className="h-3 w-3 text-white" />
          <span className="text-xs font-semibold text-white">Disponível</span>
        </div>

        {/* Heart badge */}
        <div
          className={cn(
            'absolute right-3 bottom-3 z-20',
            'flex h-10 w-10 items-center justify-center rounded-full',
            'bg-gradient-to-br from-primary to-accent',
            'shadow-lg shadow-primary/30',
            'ring-2 ring-white/80'
          )}
        >
          <Heart className="h-5 w-5 fill-white text-white" />
        </div>
      </div>

      {/* Cat info */}
      <div className={cn('space-y-2', isCompact ? 'p-3' : 'p-4')}>
        <div className="flex items-center gap-2">
          <h3
            className={cn(
              'font-bold text-foreground',
              isCompact ? 'text-lg' : 'text-xl'
            )}
            style={{ fontFamily: 'var(--font-display)' }}
          >
            {cat.name}
          </h3>

          {/* Sex badge */}
          <span
            className={cn(
              'inline-flex items-center gap-1 rounded-full px-2 py-0.5',
              'text-xs font-medium',
              cat.sex === 'male'
                ? 'bg-blue-500/15 text-blue-700'
                : 'bg-pink-500/15 text-pink-700'
            )}
          >
            {cat.sex === 'male' ? (
              <Mars className="h-3 w-3" />
            ) : (
              <Venus className="h-3 w-3" />
            )}
            {cat.sex === 'male' ? 'Macho' : 'Fêmea'}
          </span>
        </div>

        <p className="text-sm text-muted-foreground/70">
          {formatAge(cat.ageYears, cat.ageMonths)}
        </p>

        {!isCompact && (
          <div className="mt-3 rounded-xl bg-primary/5 px-3 py-2">
            <p className="text-center text-xs font-medium text-foreground/80">
              {cat.sex === 'female' ? 'Ela' : 'Ele'} está esperando por você
            </p>
          </div>
        )}
      </div>
    </div>
  )
}

function TipsCard() {
  return (
    <div
      className={cn(
        'overflow-hidden rounded-2xl',
        'bg-white/95 backdrop-blur-sm',
        'shadow-lg shadow-foreground/5',
        'border border-white/60'
      )}
    >
      {/* Accent bar */}
      <div className="h-1 bg-gradient-to-r from-primary to-accent" />

      <div className="p-4">
        <div className="flex items-start gap-3">
          <div
            className={cn(
              'flex h-9 w-9 shrink-0 items-center justify-center rounded-xl',
              'bg-gradient-to-br from-primary/15 to-accent/10'
            )}
          >
            <Lightbulb className="h-4 w-4 text-primary" />
          </div>
          <div>
            <h4 className="text-sm font-semibold text-foreground">
              Dicas para sua candidatura
            </h4>
            <ul className="mt-2 space-y-1.5 text-xs text-muted-foreground/75">
              <li className="flex items-start gap-1.5">
                <span className="mt-0.5 text-primary">•</span>
                Preencha com calma e carinho cada pergunta
              </li>
              <li className="flex items-start gap-1.5">
                <span className="mt-0.5 text-primary">•</span>
                Seja honesto sobre seu estilo de vida
              </li>
              <li className="flex items-start gap-1.5">
                <span className="mt-0.5 text-primary">•</span>A ONG avalia
                cada candidatura com atenção
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  )
}

export function ApplicationSidebar({ cat, variant }: ApplicationSidebarProps) {
  const isCompact = variant === 'compact'

  if (isCompact) {
    return <CatInfoCard cat={cat} variant="compact" />
  }

  return (
    <aside className="space-y-4 lg:sticky lg:top-6">
      <CatInfoCard cat={cat} variant="full" />
      <TipsCard />
    </aside>
  )
}
