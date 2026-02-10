'use client'

import { Cat as CatIcon } from 'lucide-react'

import { CatActionsMenu } from './cat-actions-menu'

import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'

interface Cat {
  id: string
  name: string
  ageYears: number | null
  ageMonths: number | null
  sex: 'male' | 'female'
  fiv: 'positive' | 'negative' | 'not_tested'
  felv: 'positive' | 'negative' | 'not_tested'
  castrated: boolean
  status: 'available' | 'in_progress' | 'adopted'
  photoUrl: string | null
}

interface CatListItemProps {
  cat: Cat
  orgSlug: string
  index: number
}

// Helper: Format age
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
  return 'Idade desconhecida'
}

// Helper: Status badge config
function getStatusConfig(status: Cat['status']) {
  const config = {
    available: { label: 'Disponível', variant: 'success' as const },
    in_progress: { label: 'Em processo', variant: 'warning' as const },
    adopted: { label: 'Adotado', variant: 'info' as const },
  }
  return config[status]
}

// Helper: Health badge
function HealthBadge({
  label,
  value,
}: {
  label: string
  value: 'positive' | 'negative' | 'not_tested'
}) {
  const isPositive = value === 'positive'
  const isNegative = value === 'negative'

  const variant = isPositive
    ? ('destructive' as const)
    : isNegative
      ? ('success' as const)
      : ('secondary' as const)

  const symbol = isNegative ? '-' : isPositive ? '+' : '?'

  return (
    <Badge variant={variant} className="py-0 text-[10px]">
      {label}
      {symbol}
    </Badge>
  )
}

export function CatListItem({ cat, orgSlug, index }: CatListItemProps) {
  const statusConfig = getStatusConfig(cat.status)

  return (
    <Card
      className="animate-fade-in-up hover:border-primary/20 rounded-xl border-0 shadow-sm transition-all duration-200 hover:shadow-md"
      style={{ animationDelay: `${index * 50}ms` }}
    >
      <CardContent className="p-3 sm:p-4">
        <div className="flex gap-3 sm:gap-4">
          {/* Thumbnail */}
          <div className="bg-muted relative h-16 w-16 shrink-0 overflow-hidden rounded-lg sm:h-20 sm:w-20">
            {cat.photoUrl ? (
              <img
                src={cat.photoUrl}
                alt={cat.name}
                className="h-full w-full object-cover"
                loading="lazy"
              />
            ) : (
              <div className="flex h-full w-full items-center justify-center">
                <CatIcon className="text-muted-foreground h-6 w-6" />
              </div>
            )}
          </div>

          {/* Info */}
          <div className="min-w-0 flex-1">
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0">
                <h3 className="text-foreground truncate font-semibold">
                  {cat.name}
                </h3>
                <p className="text-muted-foreground text-sm">
                  {formatAge(cat.ageYears, cat.ageMonths)} •{' '}
                  {cat.sex === 'male' ? 'Macho' : 'Fêmea'}
                </p>
              </div>

              {/* Status Badge + Actions */}
              <div className="flex shrink-0 items-center gap-2">
                <Badge
                  variant={statusConfig.variant}
                  className="hidden sm:flex"
                >
                  {statusConfig.label}
                </Badge>
                <CatActionsMenu cat={cat} orgSlug={orgSlug} />
              </div>
            </div>

            {/* Mobile status badge */}
            <div className="mt-1 sm:hidden">
              <Badge variant={statusConfig.variant} className="text-[10px]">
                {statusConfig.label}
              </Badge>
            </div>

            {/* Health info - hidden on smallest screens */}
            <div className="mt-2 hidden gap-1.5 sm:flex">
              <HealthBadge label="FIV" value={cat.fiv} />
              <HealthBadge label="FeLV" value={cat.felv} />
              {cat.castrated && (
                <Badge variant="secondary" className="py-0 text-[10px]">
                  Castrado
                </Badge>
              )}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
