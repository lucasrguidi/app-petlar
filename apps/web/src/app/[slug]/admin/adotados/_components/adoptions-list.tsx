'use client'

import { keepPreviousData, useQuery } from '@tanstack/react-query'
import { AlertTriangle, Heart, Loader2 } from 'lucide-react'
import { useState } from 'react'

import { AdoptionDetailsSheet } from './adoption-details-sheet'
import { AdoptionsDataTable } from './adoptions-data-table'
import { AdoptionsEmptyState } from './adoptions-empty-state'
import { AdoptionsPagination } from './adoptions-pagination'

import type { AdoptionsFilters } from './adoptions-page-content'

import { Skeleton } from '@/components/ui/skeleton'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { trpc } from '@/utils/trpc'

interface AdoptionsListProps {
  filters: AdoptionsFilters
  onPageChange: (page: number) => void
  onClearFilters: () => void
}

function ListSkeleton() {
  return (
    <div className="flex min-h-0 flex-1 flex-col gap-3">
      {/* Stats */}
      <div className="border-border/60 bg-card/95 shadow-warm-sm flex shrink-0 items-center justify-between rounded-xl border px-3 py-2">
        <div className="flex items-center gap-2">
          <Skeleton className="h-4 w-4" />
          <Skeleton className="h-4 w-32" />
        </div>
      </div>

      {/* Table */}
      <div className="border-border/60 bg-card/95 shadow-warm-sm flex min-h-0 flex-1 flex-col overflow-hidden rounded-xl border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="bg-muted/50 w-10 px-1.5">
                <Skeleton className="h-4 w-4" />
              </TableHead>
              <TableHead className="bg-muted/50">
                <Skeleton className="h-3 w-12" />
              </TableHead>
              <TableHead className="bg-muted/50">
                <Skeleton className="h-3 w-16" />
              </TableHead>
              <TableHead className="bg-muted/50 hidden sm:table-cell">
                <Skeleton className="h-3 w-10" />
              </TableHead>
              <TableHead className="bg-muted/50 hidden md:table-cell">
                <Skeleton className="h-3 w-12" />
              </TableHead>
              <TableHead className="bg-muted/50 w-12 px-1" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {Array.from({ length: 5 }).map((_, i) => (
              <TableRow key={i}>
                <TableCell className="w-10 px-1.5">
                  <Skeleton className="h-7 w-7 rounded-lg" />
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-3">
                    <Skeleton className="h-11 w-11 shrink-0 rounded-xl" />
                    <Skeleton className="h-4 w-20" />
                  </div>
                </TableCell>
                <TableCell>
                  <div className="space-y-1">
                    <Skeleton className="h-4 w-24" />
                    <Skeleton className="h-3 w-28" />
                  </div>
                </TableCell>
                <TableCell className="hidden sm:table-cell">
                  <Skeleton className="h-4 w-16" />
                </TableCell>
                <TableCell className="hidden md:table-cell">
                  <Skeleton className="h-8 w-14 rounded-lg" />
                </TableCell>
                <TableCell className="w-12 px-1">
                  <Skeleton className="h-8 w-8 rounded-lg" />
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}

export function AdoptionsList({
  filters,
  onPageChange,
  onClearFilters,
}: AdoptionsListProps) {
  const [selectedAdoptionId, setSelectedAdoptionId] = useState<string | null>(
    null
  )

  const { data, isLoading, isFetching, isError, refetch } = useQuery({
    ...trpc.adoptions.list.queryOptions({
      search: filters.search || undefined,
      dateFrom: filters.dateFrom,
      dateTo: filters.dateTo,
      page: filters.page,
      limit: 15,
    }),
    placeholderData: keepPreviousData,
    staleTime: 30000,
  })

  const hasFilters = Boolean(
    filters.search || filters.dateFrom || filters.dateTo
  )

  if (isLoading && !data) {
    return <ListSkeleton />
  }

  if (isError) {
    return (
      <div className="border-destructive/20 bg-destructive/5 shadow-warm-sm rounded-xl border p-4 text-center">
        <p className="text-destructive inline-flex items-center gap-2 text-sm">
          <AlertTriangle className="h-4 w-4" />
          Erro ao carregar adoções.
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

  if (!data?.adoptions.length) {
    return (
      <AdoptionsEmptyState
        hasFilters={hasFilters}
        onClearFilters={onClearFilters}
      />
    )
  }

  return (
    <>
      <div className="flex min-h-0 flex-1 flex-col gap-3">
        {/* Stats summary */}
        <div className="border-border/60 bg-card/95 shadow-warm-sm flex shrink-0 items-center justify-between rounded-xl border px-3 py-2">
          <p className="text-muted-foreground inline-flex items-center gap-2 text-sm font-medium">
            <Heart className="text-primary h-4 w-4" />
            {data.pagination.total} adoç
            {data.pagination.total !== 1 ? 'ões' : 'ão'} registrada
            {data.pagination.total !== 1 ? 's' : ''}
          </p>
          {isFetching && (
            <span className="text-muted-foreground inline-flex items-center gap-1.5 text-xs">
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
              Atualizando...
            </span>
          )}
        </div>

        {/* Table */}
        <div className="min-h-0 flex-1">
          <AdoptionsDataTable
            adoptions={data.adoptions}
            onRowClick={(id) => setSelectedAdoptionId(id)}
          />
        </div>

        {/* Pagination */}
        {data.pagination.totalPages > 1 && (
          <div className="border-border/60 bg-card/95 shadow-warm-sm shrink-0 rounded-xl border px-2">
            <AdoptionsPagination
              page={data.pagination.page}
              totalPages={data.pagination.totalPages}
              onPageChange={onPageChange}
            />
          </div>
        )}
      </div>

      <AdoptionDetailsSheet
        open={selectedAdoptionId !== null}
        adoptionId={selectedAdoptionId}
        onOpenChange={(open) => {
          if (!open) setSelectedAdoptionId(null)
        }}
      />
    </>
  )
}
