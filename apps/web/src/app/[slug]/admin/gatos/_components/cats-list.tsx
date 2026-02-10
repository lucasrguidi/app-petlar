'use client'

import { useQuery } from '@tanstack/react-query'

import { CatsDataTable } from './cats-data-table'
import { CatsEmptyState } from './cats-empty-state'
import { CatsLoadingSkeleton } from './cats-loading-skeleton'
import { CatsPagination } from './cats-pagination'

import type { CatsFilters } from './cats-page-content'

import { trpc } from '@/utils/trpc'

interface CatsListProps {
  filters: CatsFilters
  orgSlug: string
  onPageChange: (page: number) => void
  onClearFilters: () => void
}

export function CatsList({
  filters,
  orgSlug,
  onPageChange,
  onClearFilters,
}: CatsListProps) {
  const { data, isLoading, isError, refetch } = useQuery(
    trpc.cats.list.queryOptions({
      status: filters.status as
        | 'available'
        | 'in_progress'
        | 'adopted'
        | undefined,
      sex: filters.sex as 'male' | 'female' | undefined,
      fiv: filters.fiv as 'positive' | 'negative' | 'not_tested' | undefined,
      felv: filters.felv as 'positive' | 'negative' | 'not_tested' | undefined,
      castrated: filters.castrated === 'true' ? true : undefined,
      search: filters.search || undefined,
      page: filters.page,
      limit: 15,
    })
  )

  // Check if there are any active filters
  const hasActiveFilters =
    filters.status ||
    filters.sex ||
    filters.fiv ||
    filters.felv ||
    filters.castrated ||
    filters.search

  if (isLoading) {
    return <CatsLoadingSkeleton />
  }

  if (isError) {
    return (
      <div className="border-destructive/20 bg-destructive/5 rounded-xl border p-4 text-center">
        <p className="text-destructive text-sm">
          Erro ao carregar gatos.{' '}
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

  if (!data?.cats.length) {
    return (
      <CatsEmptyState
        hasFilters={Boolean(hasActiveFilters)}
        orgSlug={orgSlug}
        onClearFilters={onClearFilters}
      />
    )
  }

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      {/* Results count - fixed */}
      <p className="text-muted-foreground shrink-0 pb-2 text-sm">
        {data.pagination.total} gato
        {data.pagination.total !== 1 ? 's' : ''} encontrado
        {data.pagination.total !== 1 ? 's' : ''}
      </p>

      {/* Data Table - scrollable area */}
      <div className="min-h-0 flex-1">
        <CatsDataTable cats={data.cats} orgSlug={orgSlug} />
      </div>

      {/* Pagination - fixed at bottom */}
      <div className="shrink-0">
        <CatsPagination
          page={data.pagination.page}
          totalPages={data.pagination.totalPages}
          onPageChange={onPageChange}
        />
      </div>
    </div>
  )
}
