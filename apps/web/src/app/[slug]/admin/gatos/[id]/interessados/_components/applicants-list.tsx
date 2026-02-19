'use client'

import { useMutation, useQueryClient } from '@tanstack/react-query'
import { AlertTriangle, Loader2, PawPrint } from 'lucide-react'
import { useState } from 'react'
import { toast } from 'sonner'

import { ApplicantsDataTable } from './applicants-data-table'
import { ApplicantsEmptyState } from './applicants-empty-state'
import { ApplicantsLoadingSkeleton } from './applicants-loading-skeleton'
import { ApplicantsPagination } from './applicants-pagination'

import type { ApplicationStatus, ApplicantsListData } from './types'

import { Badge } from '@/components/ui/badge'
import { trpc } from '@/utils/trpc'

interface ApplicantsListProps {
  data: ApplicantsListData | undefined
  isLoading: boolean
  isFetching: boolean
  isError: boolean
  refetch: () => void
  hasFilters: boolean
  onClearFilters: () => void
  onPageChange: (page: number) => void
  onOpenDetails: (applicationId: string) => void
}

function getCatStatusLabel(status: 'available' | 'in_progress' | 'adopted') {
  if (status === 'available') return 'Disponível'
  if (status === 'in_progress') return 'Em processo'
  return 'Adotado'
}

function getCatStatusVariant(status: 'available' | 'in_progress' | 'adopted') {
  if (status === 'available') return 'success' as const
  if (status === 'in_progress') return 'warning' as const
  return 'info' as const
}

export function ApplicantsList({
  data,
  isLoading,
  isFetching,
  isError,
  refetch,
  hasFilters,
  onClearFilters,
  onPageChange,
  onOpenDetails,
}: ApplicantsListProps) {
  const queryClient = useQueryClient()
  const [updatingApplicationId, setUpdatingApplicationId] = useState<
    string | null
  >(null)

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

  const handleUpdateStatus = (
    applicationId: string,
    status: ApplicationStatus
  ) => {
    updateStatusMutation.mutate({ id: applicationId, status })
  }

  if (isLoading && !data) {
    return <ApplicantsLoadingSkeleton />
  }

  if (isError) {
    return (
      <div className="border-destructive/20 bg-destructive/5 shadow-warm-sm rounded-xl border p-4 text-center">
        <p className="text-destructive inline-flex items-center gap-2 text-sm">
          <AlertTriangle className="h-4 w-4" />
          Erro ao carregar candidaturas.
          <button onClick={refetch} className="underline hover:no-underline">
            Tentar novamente
          </button>
        </p>
      </div>
    )
  }

  if (!data || data.applications.length === 0) {
    return (
      <ApplicantsEmptyState
        hasFilters={hasFilters}
        onClearFilters={onClearFilters}
      />
    )
  }

  return (
    <div className="flex min-h-0 flex-1 flex-col gap-3">
      <div className="border-border/60 bg-card/95 shadow-warm-sm flex shrink-0 flex-wrap items-center justify-between gap-3 rounded-xl border px-3 py-2">
        <div className="flex min-w-0 items-center gap-2.5">
          {data.cat.photoUrl ? (
            <img
              src={data.cat.photoUrl}
              alt={data.cat.name}
              className="border-border/40 h-10 w-10 shrink-0 rounded-xl border object-cover"
            />
          ) : (
            <div className="bg-muted text-muted-foreground border-border/40 flex h-10 w-10 items-center justify-center rounded-xl border">
              <PawPrint className="h-4 w-4" />
            </div>
          )}
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold">{data.cat.name}</p>
            <p className="text-muted-foreground text-xs">
              {data.pagination.total} candidatura
              {data.pagination.total === 1 ? '' : 's'} confirmada
              {data.pagination.total === 1 ? '' : 's'}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Badge
            variant={getCatStatusVariant(data.cat.status)}
            className="rounded-full"
          >
            {getCatStatusLabel(data.cat.status)}
          </Badge>
          {isFetching && (
            <span className="text-muted-foreground inline-flex items-center gap-1.5 text-xs">
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
              Atualizando...
            </span>
          )}
        </div>
      </div>

      <div className="min-h-0 flex-1">
        <ApplicantsDataTable
          applicants={data.applications}
          onOpenDetails={onOpenDetails}
          onUpdateStatus={handleUpdateStatus}
          isUpdatingStatus={updateStatusMutation.isPending}
          updatingApplicationId={updatingApplicationId}
        />
      </div>

      <div className="border-border/60 bg-card/95 shadow-warm-sm shrink-0 rounded-xl border px-2">
        <ApplicantsPagination
          page={data.pagination.page}
          totalPages={data.pagination.totalPages}
          onPageChange={onPageChange}
        />
      </div>
    </div>
  )
}
