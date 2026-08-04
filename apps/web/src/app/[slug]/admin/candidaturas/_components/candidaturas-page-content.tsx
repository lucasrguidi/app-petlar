'use client'

import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { AlertTriangle, Loader2 } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { useCallback, useMemo, useState, useTransition } from 'react'
import { toast } from 'sonner'

import { ApplicantDetailsSheet } from '../../gatos/[id]/interessados/_components/applicant-details-sheet'

import {
  CandidaturasDataTable,
  type CandidaturaRow,
  type CatStatus,
} from './candidaturas-data-table'
import { CandidaturasEmptyState } from './candidaturas-empty-state'
import {
  CandidaturasFilterBar,
  type CandidaturasFilters,
} from './candidaturas-filter-bar'
import { CandidaturasLoadingSkeleton } from './candidaturas-loading-skeleton'

import type { ApplicationStatus } from '../../gatos/[id]/interessados/_components/types'

import { BasePagination } from '@/components/base-pagination'
import { trpc } from '@/utils/trpc'

const VALID_STATUSES: ApplicationStatus[] = [
  'pending',
  'reviewing',
  'approved',
  'rejected',
  'permanently_rejected',
]

function isValidStatus(value: unknown): value is ApplicationStatus {
  return (
    typeof value === 'string' && (VALID_STATUSES as string[]).includes(value)
  )
}

function parseFilters(searchParams: {
  status?: string
  search?: string
  includeAdopted?: string
  page?: string
}): CandidaturasFilters {
  const pageRaw = Number.parseInt(searchParams.page ?? '1', 10)

  return {
    status: isValidStatus(searchParams.status)
      ? searchParams.status
      : undefined,
    search: searchParams.search?.trim() || undefined,
    includeAdopted: searchParams.includeAdopted === 'true' || undefined,
    page: Number.isFinite(pageRaw) && pageRaw > 0 ? pageRaw : 1,
  }
}

interface CandidaturasPageContentProps {
  searchParams: {
    status?: string
    search?: string
    includeAdopted?: string
    page?: string
  }
}

export function CandidaturasPageContent({
  searchParams,
}: CandidaturasPageContentProps) {
  const router = useRouter()
  const queryClient = useQueryClient()
  const [isPending, startTransition] = useTransition()
  const [selectedApplicationId, setSelectedApplicationId] = useState<
    string | null
  >(null)
  const [updatingApplicationId, setUpdatingApplicationId] = useState<
    string | null
  >(null)

  const filters = useMemo(() => parseFilters(searchParams), [searchParams])

  const listQuery = useQuery({
    ...trpc.applications.listAll.queryOptions({
      status: filters.status,
      search: filters.search,
      includeAdopted: filters.includeAdopted ?? false,
      page: filters.page,
      limit: 15,
    }),
    placeholderData: keepPreviousData,
  })

  const updateStatusMutation = useMutation(
    trpc.applications.updateStatus.mutationOptions({
      onMutate: ({ id }) => {
        setUpdatingApplicationId(id)
      },
      onSuccess: () => {
        toast.success('Status atualizado com sucesso')
        queryClient.invalidateQueries({ queryKey: [['applications']] })
      },
      onError: (error) => {
        toast.error(error.message || 'Não foi possível atualizar o status')
      },
      onSettled: () => {
        setUpdatingApplicationId(null)
      },
    })
  )

  const handleUpdateStatus = useCallback(
    (applicationId: string, status: ApplicationStatus) => {
      updateStatusMutation.mutate({ id: applicationId, status })
    },
    [updateStatusMutation]
  )

  const updateFilters = useCallback(
    (newFilters: Partial<CandidaturasFilters>, resetPage = true) => {
      startTransition(() => {
        const merged: CandidaturasFilters = {
          ...filters,
          ...newFilters,
          page: resetPage ? 1 : (newFilters.page ?? filters.page),
        }

        const params = new URLSearchParams()

        if (merged.status) {
          params.set('status', merged.status)
        }

        if (merged.search && merged.search.trim().length > 0) {
          params.set('search', merged.search.trim())
        }

        if (merged.includeAdopted) {
          params.set('includeAdopted', 'true')
        }

        if (merged.page > 1) {
          params.set('page', String(merged.page))
        }

        const queryString = params.toString()
        router.push(queryString ? `?${queryString}` : '?', { scroll: false })
      })
    },
    [filters, router]
  )

  const handlePageChange = useCallback(
    (page: number) => {
      updateFilters({ page }, false)
    },
    [updateFilters]
  )

  const clearAllFilters = useCallback(() => {
    updateFilters({
      status: undefined,
      search: undefined,
      includeAdopted: undefined,
    })
  }, [updateFilters])

  const hasActiveFilters = Boolean(
    filters.status || filters.search || filters.includeAdopted
  )

  if (listQuery.isLoading && !listQuery.data) {
    return <CandidaturasLoadingSkeleton />
  }

  if (listQuery.isError) {
    return (
      <div className="border-destructive/20 bg-destructive/5 shadow-warm-sm rounded-xl border p-4 text-center">
        <p className="text-destructive inline-flex items-center gap-2 text-sm">
          <AlertTriangle className="h-4 w-4" />
          Erro ao carregar candidaturas.
          <button
            onClick={() => {
              void listQuery.refetch()
            }}
            className="underline hover:no-underline"
          >
            Tentar novamente
          </button>
        </p>
      </div>
    )
  }

  const data = listQuery.data

  if (!data || data.applications.length === 0) {
    return (
      <div className="flex min-h-0 flex-1 flex-col gap-3">
        <div className="shrink-0">
          <CandidaturasFilterBar
            filters={filters}
            onFilterChange={updateFilters}
            isPending={isPending}
          />
        </div>
        <CandidaturasEmptyState
          hasFilters={hasActiveFilters}
          onClearFilters={clearAllFilters}
        />
      </div>
    )
  }

  const rows: CandidaturaRow[] = data.applications.map((app) => ({
    id: app.id,
    applicantName: app.applicantName,
    applicantWhatsapp: app.applicantWhatsapp,
    status: app.status as ApplicationStatus,
    isPermanentRejectionActive: app.isPermanentRejectionActive,
    createdAt: app.createdAt,
    catId: app.catId,
    groupId: app.groupId,
    catName: app.catName,
    catPhotoUrl: app.catPhotoUrl,
    catStatus: (app.catStatus as CatStatus) ?? null,
    groupCatNames: app.groupCatNames,
  }))

  return (
    <div className="flex min-h-0 flex-1 flex-col gap-3">
      <div className="shrink-0">
        <CandidaturasFilterBar
          filters={filters}
          onFilterChange={updateFilters}
          isPending={isPending}
        />
      </div>

      <div className="border-border/60 bg-card/95 shadow-warm-sm flex shrink-0 items-center justify-between rounded-xl border px-3 py-2">
        <p className="text-muted-foreground text-sm">
          {data.pagination.total} candidatura
          {data.pagination.total === 1 ? '' : 's'} confirmada
          {data.pagination.total === 1 ? '' : 's'}
        </p>
        {listQuery.isFetching && (
          <span className="text-muted-foreground inline-flex items-center gap-1.5 text-xs">
            <Loader2 className="h-3.5 w-3.5 animate-spin" />
            Atualizando...
          </span>
        )}
      </div>

      <div className="min-h-0 flex-1">
        <CandidaturasDataTable
          rows={rows}
          onOpenDetails={(applicationId) =>
            setSelectedApplicationId(applicationId)
          }
          onUpdateStatus={handleUpdateStatus}
          isUpdatingStatus={updateStatusMutation.isPending}
          updatingApplicationId={updatingApplicationId}
        />
      </div>

      <div className="border-border/60 bg-card/95 shadow-warm-sm shrink-0 rounded-xl border px-2">
        <BasePagination
          page={data.pagination.page}
          totalPages={data.pagination.totalPages}
          onPageChange={handlePageChange}
        />
      </div>

      <ApplicantDetailsSheet
        open={Boolean(selectedApplicationId)}
        applicationId={selectedApplicationId}
        onOpenChange={(open) => {
          if (!open) {
            setSelectedApplicationId(null)
          }
        }}
      />
    </div>
  )
}
