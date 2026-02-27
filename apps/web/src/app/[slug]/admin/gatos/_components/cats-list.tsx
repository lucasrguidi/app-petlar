'use client'

import { keepPreviousData, useQuery } from '@tanstack/react-query'
import { AlertTriangle, Loader2, PawPrint } from 'lucide-react'

import { CatsDataTable } from './cats-data-table'
import { CatsEmptyState } from './cats-empty-state'
import { CatsLoadingSkeleton } from './cats-loading-skeleton'
import { CatsPagination } from './cats-pagination'

import type { CatsFilters, CatStatusFilter } from './cats-page-content'

import { trpc } from '@/utils/trpc'

interface CatsListProps {
  filters: CatsFilters
  onPageChange: (page: number) => void
  onClearFilters: () => void
}

function isAdminCatStatus(status: string): status is CatStatusFilter {
  return status === 'available' || status === 'in_progress'
}

export function CatsList({
  filters,
  onPageChange,
  onClearFilters,
}: CatsListProps) {
  const { data, isLoading, isFetching, isError, refetch } = useQuery({
    ...trpc.cats.list.queryOptions({
      status: filters.status,
      sex: filters.sex as 'male' | 'female' | undefined,
      fiv: filters.fiv as 'positive' | 'negative' | 'not_tested' | undefined,
      felv: filters.felv as 'positive' | 'negative' | 'not_tested' | undefined,
      castrated: filters.castrated === 'true' ? true : undefined,
      search: filters.search || undefined,
      page: filters.page,
      limit: 15,
    }),
    // Keep previous data visible while fetching new data
    placeholderData: keepPreviousData,
  })

  // Check if there are any active filters
  const hasActiveFilters =
    filters.status ||
    filters.sex ||
    filters.fiv ||
    filters.felv ||
    filters.castrated ||
    filters.search

  // Only show skeleton on initial load (no cached data)
  if (isLoading && !data) {
    return <CatsLoadingSkeleton />
  }

  if (isError) {
    return (
      <div className="border-destructive/20 bg-destructive/5 shadow-warm-sm rounded-xl border p-4 text-center">
        <p className="text-destructive inline-flex items-center gap-2 text-sm">
          <AlertTriangle className="h-4 w-4" />
          Erro ao carregar gatos.
          <button
            onClick={() => refetch()}
            className="underline hover:no-underline"
          >
            Tentar novamente
          </button>
        </p>
      </div>
    )
  }

  if (!data) {
    return <CatsLoadingSkeleton />
  }

  const visibleCats = data.cats.filter(
    (cat): cat is (typeof data.cats)[number] & { status: CatStatusFilter } =>
      isAdminCatStatus(cat.status)
  )

  if (!visibleCats.length) {
    return (
      <CatsEmptyState
        hasFilters={Boolean(hasActiveFilters)}
        onClearFilters={onClearFilters}
      />
    )
  }

  return (
    <div className="flex min-h-0 flex-1 flex-col gap-3">
      <div className="border-border/60 bg-card/95 shadow-warm-sm flex shrink-0 items-center justify-between rounded-xl border px-3 py-2">
        <p className="text-muted-foreground inline-flex items-center gap-2 text-sm font-medium">
          <PawPrint className="text-primary h-4 w-4" />
          {data.pagination.total} gato
          {data.pagination.total !== 1 ? 's' : ''} encontrado
          {data.pagination.total !== 1 ? 's' : ''}
        </p>
        {isFetching && (
          <span className="text-muted-foreground inline-flex items-center gap-1.5 text-xs">
            <Loader2 className="h-3.5 w-3.5 animate-spin" />
            Atualizando...
          </span>
        )}
      </div>

      <div className="min-h-0 flex-1">
        <CatsDataTable cats={visibleCats} />
      </div>

      <div className="border-border/60 bg-card/95 shadow-warm-sm shrink-0 rounded-xl border px-2">
        <CatsPagination
          page={data.pagination.page}
          totalPages={data.pagination.totalPages}
          onPageChange={onPageChange}
        />
      </div>
    </div>
  )
}
