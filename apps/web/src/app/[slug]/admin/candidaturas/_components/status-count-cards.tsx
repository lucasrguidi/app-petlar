'use client'

import {
  CheckCircle2,
  Clock,
  Eye,
  XCircle,
} from 'lucide-react'

import type { ApplicationStatus } from '../../gatos/[id]/interessados/_components/types'

import { Skeleton } from '@/components/ui/skeleton'
import { cn } from '@/lib/utils'

interface StatusCountCardsProps {
  counts?: Record<string, number>
  activeStatus: ApplicationStatus | undefined
  onStatusClick: (status: ApplicationStatus | undefined) => void
}

const STATUS_CARDS = [
  {
    status: 'pending' as const,
    label: 'Pendentes',
    icon: Clock,
    activeClass: 'border-amber-400/60 bg-amber-50/80 ring-2 ring-amber-400/20',
    iconClass: 'text-amber-600',
    countClass: 'text-amber-700',
    darkActiveClass: 'dark:border-amber-500/40 dark:bg-amber-950/30 dark:ring-amber-500/15',
    darkIconClass: 'dark:text-amber-400',
    darkCountClass: 'dark:text-amber-300',
  },
  {
    status: 'reviewing' as const,
    label: 'Em análise',
    icon: Eye,
    activeClass: 'border-blue-400/60 bg-blue-50/80 ring-2 ring-blue-400/20',
    iconClass: 'text-blue-600',
    countClass: 'text-blue-700',
    darkActiveClass: 'dark:border-blue-500/40 dark:bg-blue-950/30 dark:ring-blue-500/15',
    darkIconClass: 'dark:text-blue-400',
    darkCountClass: 'dark:text-blue-300',
  },
  {
    status: 'approved' as const,
    label: 'Aprovados',
    icon: CheckCircle2,
    activeClass: 'border-emerald-400/60 bg-emerald-50/80 ring-2 ring-emerald-400/20',
    iconClass: 'text-emerald-600',
    countClass: 'text-emerald-700',
    darkActiveClass: 'dark:border-emerald-500/40 dark:bg-emerald-950/30 dark:ring-emerald-500/15',
    darkIconClass: 'dark:text-emerald-400',
    darkCountClass: 'dark:text-emerald-300',
  },
  {
    status: 'rejected' as const,
    label: 'Recusados',
    icon: XCircle,
    activeClass: 'border-red-400/60 bg-red-50/80 ring-2 ring-red-400/20',
    iconClass: 'text-red-600',
    countClass: 'text-red-700',
    darkActiveClass: 'dark:border-red-500/40 dark:bg-red-950/30 dark:ring-red-500/15',
    darkIconClass: 'dark:text-red-400',
    darkCountClass: 'dark:text-red-300',
  },
] as const

export function StatusCountCards({
  counts,
  activeStatus,
  onStatusClick,
}: StatusCountCardsProps) {
  if (!counts) {
    return (
      <div className="grid shrink-0 grid-cols-2 gap-2 sm:grid-cols-4">
        {STATUS_CARDS.map((card) => (
          <Skeleton
            key={card.status}
            className="h-[72px] rounded-xl"
          />
        ))}
      </div>
    )
  }

  const total =
    (counts.pending ?? 0) +
    (counts.reviewing ?? 0) +
    (counts.approved ?? 0) +
    (counts.rejected ?? 0) +
    (counts.permanently_rejected ?? 0)

  return (
    <div className="grid shrink-0 grid-cols-2 gap-2 sm:grid-cols-4 lg:grid-cols-5">
      {STATUS_CARDS.map((card) => {
        const count =
          card.status === 'rejected'
            ? (counts.rejected ?? 0) + (counts.permanently_rejected ?? 0)
            : (counts[card.status] ?? 0)
        const isActive = activeStatus === card.status
        const Icon = card.icon

        return (
          <button
            key={card.status}
            type="button"
            onClick={() =>
              onStatusClick(isActive ? undefined : card.status)
            }
            className={cn(
              'border-border/60 bg-card/95 shadow-warm-sm flex flex-col items-start rounded-xl border px-3 py-2.5 text-left transition-all hover:shadow-md',
              isActive && card.activeClass,
              isActive && card.darkActiveClass
            )}
          >
            <div className="flex w-full items-center justify-between">
              <Icon
                className={cn(
                  'text-muted-foreground h-4 w-4',
                  isActive && card.iconClass,
                  isActive && card.darkIconClass
                )}
              />
              <span
                className={cn(
                  'text-foreground text-xl font-bold tabular-nums',
                  isActive && card.countClass,
                  isActive && card.darkCountClass
                )}
              >
                {count}
              </span>
            </div>
            <span className="text-muted-foreground mt-0.5 text-xs">
              {card.label}
            </span>
          </button>
        )
      })}

      <button
        type="button"
        onClick={() => onStatusClick(undefined)}
        className={cn(
          'border-border/60 bg-card/95 shadow-warm-sm col-span-2 flex flex-col items-start rounded-xl border px-3 py-2.5 text-left transition-all hover:shadow-md sm:col-span-4 lg:col-span-1',
          !activeStatus &&
            'border-primary/30 bg-primary/5 ring-primary/15 ring-2 dark:border-primary/20 dark:bg-primary/10 dark:ring-primary/10'
        )}
      >
        <div className="flex w-full items-center justify-between">
          <span className="text-muted-foreground text-xs font-medium">
            Total
          </span>
          <span
            className={cn(
              'text-foreground text-xl font-bold tabular-nums',
              !activeStatus && 'text-primary dark:text-primary'
            )}
          >
            {total}
          </span>
        </div>
        <span className="text-muted-foreground mt-0.5 text-xs">
          Todas
        </span>
      </button>
    </div>
  )
}
