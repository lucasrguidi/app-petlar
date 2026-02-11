'use client'

import {
  Cat as CatIcon,
  Clock3,
  Check,
  ChevronDown,
  ChevronRight,
  ShieldCheck,
  Users,
  X,
} from 'lucide-react'

import { CatActionsMenu } from './cat-actions-menu'

import type { ColumnDef, Row } from '@tanstack/react-table'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { DataTable } from '@/components/ui/data-table'
import { cn } from '@/lib/utils'

// Types
interface Cat {
  id: string
  name: string
  ageYears: number | null
  ageMonths: number | null
  sex: 'male' | 'female'
  fiv: 'positive' | 'negative' | 'not_tested'
  felv: 'positive' | 'negative' | 'not_tested'
  castrated: boolean
  vaccinated: boolean
  dewormed: boolean
  description: string | null
  status: 'available' | 'in_progress' | 'adopted'
  photoUrl: string | null
  interestedCount?: number
}

interface CatsDataTableProps {
  cats: Cat[]
}

// Helper: Format age compact
function formatAge(years: number | null, months: number | null): string {
  if (years && years > 0) {
    if (months && months > 0) {
      return `${years}a ${months}m`
    }
    return `${years}a`
  }
  if (months && months > 0) {
    return `${months}m`
  }
  return '-'
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
    <Badge variant={variant} className="rounded-md px-1.5 py-0 text-[10px]">
      {label}
      {symbol}
    </Badge>
  )
}

// Expanded row content
function ExpandedContent({ cat }: { cat: Cat }) {
  return (
    <div className="border-border/50 bg-sidebar-accent/40 animate-in fade-in-0 slide-in-from-top-1 border-t px-3 py-2.5 duration-200">
      <div className="grid gap-3 text-xs sm:grid-cols-2 lg:grid-cols-4">
        {/* Health Info */}
        <div className="space-y-1">
          <p className="text-muted-foreground font-medium uppercase tracking-wide">
            Saúde
          </p>
          <div className="flex flex-wrap gap-1">
            <HealthBadge label="FIV" value={cat.fiv} />
            <HealthBadge label="FeLV" value={cat.felv} />
          </div>
        </div>

        {/* Cuidados */}
        <div className="space-y-1">
          <p className="text-muted-foreground font-medium uppercase tracking-wide">
            Cuidados
          </p>
          <div className="flex flex-wrap gap-2">
            <span
              className={cn(
                'inline-flex items-center gap-0.5',
                cat.castrated ? 'text-success' : 'text-muted-foreground'
              )}
            >
              {cat.castrated ? (
                <Check className="h-3 w-3" />
              ) : (
                <X className="h-3 w-3" />
              )}
              Castrado
            </span>
            <span
              className={cn(
                'inline-flex items-center gap-0.5',
                cat.vaccinated ? 'text-success' : 'text-muted-foreground'
              )}
            >
              {cat.vaccinated ? (
                <Check className="h-3 w-3" />
              ) : (
                <X className="h-3 w-3" />
              )}
              Vacinado
            </span>
            <span
              className={cn(
                'inline-flex items-center gap-0.5',
                cat.dewormed ? 'text-success' : 'text-muted-foreground'
              )}
            >
              {cat.dewormed ? (
                <Check className="h-3 w-3" />
              ) : (
                <X className="h-3 w-3" />
              )}
              Vermifugado
            </span>
          </div>
        </div>

        {/* Description */}
        {cat.description && (
          <div className="space-y-1 sm:col-span-2">
            <p className="text-muted-foreground font-medium uppercase tracking-wide">
              Descrição
            </p>
            <p className="text-foreground/80 leading-relaxed">
              {cat.description}
            </p>
          </div>
        )}
      </div>
    </div>
  )
}

// Column definitions
const columns: ColumnDef<Cat>[] = [
    // Expand column
    {
      id: 'expand',
      header: () => null,
      cell: ({ row }) => (
        <Button
          variant="ghost"
          size="icon"
          className="h-6 w-6 rounded-md"
          onClick={() => row.toggleExpanded()}
          aria-label={row.getIsExpanded() ? 'Recolher' : 'Expandir'}
        >
          {row.getIsExpanded() ? (
            <ChevronDown className="h-3.5 w-3.5" />
          ) : (
            <ChevronRight className="h-3.5 w-3.5" />
          )}
        </Button>
      ),
      meta: { className: 'w-8 px-1' },
    },
    // Photo + Name
    {
      id: 'cat',
      accessorKey: 'name',
      header: () => (
        <span className="inline-flex items-center gap-1.5">
          <CatIcon className="text-primary h-3.5 w-3.5" />
          Gato
        </span>
      ),
      cell: ({ row }) => {
        const cat = row.original
        return (
          <div className="flex items-center gap-2">
            <div className="bg-muted relative h-8 w-8 shrink-0 overflow-hidden rounded-lg">
              {cat.photoUrl ? (
                <img
                  src={cat.photoUrl}
                  alt={cat.name}
                  className="h-full w-full object-cover"
                  loading="lazy"
                />
              ) : (
                <div className="flex h-full w-full items-center justify-center">
                  <CatIcon className="text-muted-foreground h-4 w-4" />
                </div>
              )}
            </div>
            <div className="min-w-0">
              <p className="text-foreground truncate text-sm font-medium">
                {cat.name}
              </p>
              <p className="text-muted-foreground truncate text-[11px] sm:hidden">
                {formatAge(cat.ageYears, cat.ageMonths)} •{' '}
                {cat.sex === 'male' ? 'M' : 'F'}
              </p>
            </div>
          </div>
        )
      },
      meta: { className: 'min-w-[120px]' },
    },
    // Age (hidden on mobile)
    {
      id: 'age',
      accessorFn: (row) => (row.ageYears ?? 0) * 12 + (row.ageMonths ?? 0),
      header: () => (
        <span className="hidden items-center gap-1 sm:inline-flex">
          <Clock3 className="h-3.5 w-3.5" />
          Idade
        </span>
      ),
      cell: ({ row }) => (
        <span className="text-muted-foreground hidden text-sm sm:inline">
          {formatAge(row.original.ageYears, row.original.ageMonths)}
        </span>
      ),
      meta: { className: 'hidden sm:table-cell w-16' },
    },
    // Sex (hidden on mobile)
    {
      id: 'sex',
      accessorKey: 'sex',
      header: () => <span className="hidden md:inline">Sexo</span>,
      cell: ({ row }) => (
        <span className="text-muted-foreground hidden text-sm md:inline">
          {row.original.sex === 'male' ? 'Macho' : 'Fêmea'}
        </span>
      ),
      meta: { className: 'hidden md:table-cell w-16' },
    },
    // Interested count
    {
      id: 'interested',
      accessorKey: 'interestedCount',
      header: () => (
        <span className="hidden lg:inline" title="Interessados">
          <Users className="h-4 w-4" />
        </span>
      ),
      cell: ({ row }) => {
        const count = row.original.interestedCount ?? 0
        return (
          <span
            className={cn(
              'hidden text-sm lg:inline',
              count > 0 ? 'text-primary font-medium' : 'text-muted-foreground'
            )}
          >
            {count}
          </span>
        )
      },
      meta: { className: 'hidden lg:table-cell w-12 text-center' },
    },
    // Status
    {
      id: 'status',
      accessorKey: 'status',
      header: () => (
        <span className="hidden items-center gap-1 sm:inline-flex">
          <ShieldCheck className="h-3.5 w-3.5" />
          Status
        </span>
      ),
      cell: ({ row }) => {
        const config = getStatusConfig(row.original.status)
        return (
          <Badge
            variant={config.variant}
            className="hidden whitespace-nowrap px-1.5 py-0 text-[10px] sm:inline-flex"
          >
            {config.label}
          </Badge>
        )
      },
      meta: { className: 'hidden sm:table-cell' },
    },
    // Actions - always visible, sticky on mobile
    {
      id: 'actions',
      header: () => null,
      cell: ({ row }) => <CatActionsMenu cat={row.original} />,
      meta: {
        className:
          'w-10 px-1 sticky right-0 bg-card/95 group-hover:bg-sidebar-accent/20',
        headerClassName: 'sticky right-0 bg-muted/50',
      },
    },
  ]

export function CatsDataTable({ cats }: CatsDataTableProps) {
  return (
    <DataTable
      columns={columns}
      data={cats}
      className="border-border/60 bg-card/95 shadow-warm-sm rounded-xl border"
      renderExpandedRow={(row: Row<Cat>) => (
        <ExpandedContent cat={row.original} />
      )}
    />
  )
}
