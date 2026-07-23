'use client'

import {
  Cat,
  Check,
  ChevronRight,
  Download,
  Mars,
  MessageCircle,
  Venus,
  X,
} from 'lucide-react'
import { useMemo } from 'react'

import { AdoptionActionsMenu } from './adoption-actions-menu'

import type { ColumnDef, Row } from '@tanstack/react-table'

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { DataTable } from '@/components/ui/data-table'
import { cn } from '@/lib/utils'

interface Adoption {
  id: string
  catId: string
  catName: string
  catSex: 'male' | 'female'
  catAgeYears: number | null
  catAgeMonths: number | null
  catFiv: 'positive' | 'negative' | 'not_tested'
  catFelv: 'positive' | 'negative' | 'not_tested'
  catCastrated: boolean
  catPhotoUrl: string | null
  adopterName: string
  adopterPhone: string
  adopterEmail: string | null
  adoptionDate: string
  adoptionTermUrl: string | null
  notes: string | null
}

interface AdoptionsDataTableProps {
  adoptions: Adoption[]
  onRowClick: (id: string) => void
}

// Helpers
function formatDate(dateStr: string): string {
  const [year, month, day] = dateStr.split('-')
  return `${day}/${month}/${year}`
}

function toWhatsappLink(phone: string): string {
  const digits = phone.replace(/\D/g, '')
  return `https://wa.me/55${digits}`
}

function formatPhone(phone: string): string {
  const digits = phone.replace(/\D/g, '')
  if (digits.length === 11) {
    return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7)}`
  }
  if (digits.length === 10) {
    return `(${digits.slice(0, 2)}) ${digits.slice(2, 6)}-${digits.slice(6)}`
  }
  return phone
}

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

// Column header component
function ColumnHeader({
  icon: Icon,
  label,
  className,
}: {
  icon?: React.ElementType
  label: string
  className?: string
}) {
  return (
    <span
      className={cn(
        'text-muted-foreground inline-flex items-center gap-1.5 text-xs font-medium',
        className
      )}
    >
      {Icon && <Icon className="h-3.5 w-3.5 opacity-70" />}
      {label}
    </span>
  )
}

// Health badge component
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
    <Badge
      variant={variant}
      className="rounded-md px-1.5 py-0.5 text-[10px] font-medium"
    >
      {label}
      {symbol}
    </Badge>
  )
}

// Care indicator component
function CareIndicator({ label, active }: { label: string; active: boolean }) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-xs transition-colors',
        active
          ? 'bg-success/10 text-success'
          : 'bg-muted/60 text-muted-foreground'
      )}
    >
      {active ? (
        <Check className="h-3 w-3" strokeWidth={2.5} />
      ) : (
        <X className="h-3 w-3" />
      )}
      {label}
    </span>
  )
}

// Expanded row content
function ExpandedContent({ adoption }: { adoption: Adoption }) {
  const hasNotes = adoption.notes && adoption.notes.trim().length > 0

  return (
    <div className="animate-in fade-in-0 slide-in-from-top-1 border-border/40 from-muted/30 to-muted/10 border-t bg-gradient-to-b px-4 py-3 duration-200">
      <div className="grid gap-4 text-xs sm:grid-cols-2 lg:grid-cols-4">
        {/* Cat Info */}
        <div className="space-y-2">
          <p className="text-muted-foreground/80 text-[10px] font-semibold tracking-wider uppercase">
            Info do gato
          </p>
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-sm font-medium">{adoption.catName}</span>
            <span className="text-muted-foreground">•</span>
            <span
              className={cn(
                'inline-flex items-center gap-1 text-sm',
                adoption.catSex === 'male' ? 'text-blue-600' : 'text-pink-500'
              )}
            >
              {adoption.catSex === 'male' ? (
                <Mars className="h-3.5 w-3.5" />
              ) : (
                <Venus className="h-3.5 w-3.5" />
              )}
              {adoption.catSex === 'male' ? 'Macho' : 'Fêmea'}
            </span>
            <span className="text-muted-foreground">•</span>
            <span className="text-foreground/80 text-sm">
              {formatAge(adoption.catAgeYears, adoption.catAgeMonths)}
            </span>
          </div>
        </div>

        {/* Health */}
        <div className="space-y-2">
          <p className="text-muted-foreground/80 text-[10px] font-semibold tracking-wider uppercase">
            Saúde
          </p>
          <div className="flex flex-wrap gap-1.5">
            <HealthBadge label="FIV" value={adoption.catFiv} />
            <HealthBadge label="FeLV" value={adoption.catFelv} />
            <CareIndicator label="Castrado" active={adoption.catCastrated} />
          </div>
        </div>

        {/* Notes */}
        {hasNotes && (
          <div className="space-y-2 sm:col-span-2">
            <p className="text-muted-foreground/80 text-[10px] font-semibold tracking-wider uppercase">
              Observações
            </p>
            <p className="text-foreground/80 line-clamp-3 leading-relaxed">
              {adoption.notes}
            </p>
          </div>
        )}
      </div>
    </div>
  )
}

function getColumns(onRowClick: (id: string) => void): ColumnDef<Adoption>[] {
  return [
    // Expand column - hidden on mobile to save space
    {
      id: 'expand',
      header: () => null,
      cell: ({ row }) => (
        <Button
          variant="ghost"
          size="icon"
          className={cn(
            'h-7 w-7 rounded-lg transition-all duration-200',
            row.getIsExpanded()
              ? 'bg-primary/10 text-primary'
              : 'text-muted-foreground hover:bg-muted hover:text-foreground'
          )}
          onClick={() => row.toggleExpanded()}
          aria-label={row.getIsExpanded() ? 'Recolher' : 'Expandir'}
        >
          <ChevronRight
            className={cn(
              'h-4 w-4 transition-transform duration-200',
              row.getIsExpanded() && 'rotate-90'
            )}
          />
        </Button>
      ),
      meta: { className: 'hidden sm:table-cell w-10 px-1.5' },
    },
    // Cat column
    {
      id: 'cat',
      accessorKey: 'catName',
      header: () => <ColumnHeader icon={Cat} label="Gato" />,
      cell: ({ row }) => {
        const adoption = row.original

        return (
          <div className="flex items-center gap-2 sm:gap-3">
            <Avatar className="border-border/40 hidden h-11 w-11 rounded-xl border shadow-sm sm:flex">
              {adoption.catPhotoUrl ? (
                <AvatarImage
                  src={adoption.catPhotoUrl}
                  alt={adoption.catName}
                  className="object-cover"
                />
              ) : null}
              <AvatarFallback className="bg-muted rounded-xl">
                <Cat className="text-muted-foreground h-5 w-5" />
              </AvatarFallback>
            </Avatar>
            <div className="min-w-0 space-y-0.5">
              <p className="text-foreground truncate text-sm leading-tight font-semibold">
                {adoption.catName}
              </p>
              {/* Mobile-only: show adopter with WhatsApp link like interessados */}
              <a
                href={toWhatsappLink(adoption.adopterPhone)}
                target="_blank"
                rel="noreferrer"
                className="text-primary inline-flex items-center gap-1.5 text-xs font-medium hover:underline sm:hidden"
                onClick={(e) => e.stopPropagation()}
              >
                <MessageCircle className="h-3.5 w-3.5" />
                {adoption.adopterName}
              </a>
            </div>
          </div>
        )
      },
      meta: { className: 'min-w-[160px]' },
    },
    // Adopter column - hidden on mobile (shown inside cat column)
    {
      id: 'adopter',
      accessorKey: 'adopterName',
      header: () => (
        <span className="text-muted-foreground hidden text-xs font-medium sm:inline">
          Adotante
        </span>
      ),
      cell: ({ row }) => {
        const adoption = row.original

        return (
          <div className="hidden space-y-0.5 sm:block">
            <p className="font-medium">{adoption.adopterName}</p>
            <a
              href={toWhatsappLink(adoption.adopterPhone)}
              target="_blank"
              rel="noreferrer"
              className="text-primary inline-flex items-center gap-1 text-xs hover:underline"
              onClick={(e) => e.stopPropagation()}
            >
              <MessageCircle className="h-3 w-3" />
              {formatPhone(adoption.adopterPhone)}
            </a>
          </div>
        )
      },
      meta: { className: 'hidden sm:table-cell min-w-[160px]' },
    },
    // Date column - visible on mobile too
    {
      id: 'date',
      accessorKey: 'adoptionDate',
      header: () => (
        <span className="text-muted-foreground text-xs font-medium">Data</span>
      ),
      cell: ({ row }) => (
        <span className="text-muted-foreground text-sm tabular-nums">
          {formatDate(row.original.adoptionDate)}
        </span>
      ),
      meta: { className: 'w-20 sm:w-24' },
    },
    // Term column
    {
      id: 'term',
      accessorKey: 'adoptionTermUrl',
      header: () => (
        <span className="text-muted-foreground hidden text-xs font-medium md:inline">
          Termo
        </span>
      ),
      cell: ({ row }) => {
        const url = row.original.adoptionTermUrl

        if (!url) {
          return (
            <span className="text-muted-foreground hidden text-sm md:inline">
              -
            </span>
          )
        }

        return (
          <a
            href={url}
            target="_blank"
            rel="noreferrer"
            onClick={(e) => e.stopPropagation()}
            className="hidden md:inline-block"
          >
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="text-primary hover:text-primary h-8 gap-1.5 rounded-lg"
            >
              <Download className="h-3.5 w-3.5" />
              PDF
            </Button>
          </a>
        )
      },
      meta: { className: 'hidden md:table-cell w-24' },
    },
    // Actions column
    {
      id: 'actions',
      header: () => null,
      cell: ({ row }) => (
        <div className="flex justify-end">
          <AdoptionActionsMenu
            adoption={row.original}
            onView={() => onRowClick(row.original.id)}
          />
        </div>
      ),
      meta: {
        className: 'w-12',
        headerClassName: 'w-12',
      },
    },
  ]
}

export function AdoptionsDataTable({
  adoptions,
  onRowClick,
}: AdoptionsDataTableProps) {
  const columns = useMemo(() => getColumns(onRowClick), [onRowClick])

  return (
    <DataTable
      columns={columns}
      data={adoptions}
      className="border-border/50 bg-card shadow-warm-sm overflow-hidden rounded-xl border"
      renderExpandedRow={(row: Row<Adoption>) => (
        <ExpandedContent adoption={row.original} />
      )}
    />
  )
}
