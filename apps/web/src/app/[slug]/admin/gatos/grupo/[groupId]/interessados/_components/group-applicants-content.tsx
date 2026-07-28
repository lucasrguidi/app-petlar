'use client'

import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  AlertTriangle,
  Cat as CatIcon,
  Loader2,
  Search,
  Users,
} from 'lucide-react'
import { useRouter } from 'next/navigation'
import { useCallback, useEffect, useMemo, useState, useTransition } from 'react'
import { toast } from 'sonner'

import { ApplicantDetailsSheet } from '../../../../[id]/interessados/_components/applicant-details-sheet'
import { ApplicantsDataTable } from '../../../../[id]/interessados/_components/applicants-data-table'
import { ApplicantsEmptyState } from '../../../../[id]/interessados/_components/applicants-empty-state'
import { ApplicantsLoadingSkeleton } from '../../../../[id]/interessados/_components/applicants-loading-skeleton'
import { ApplicantsPagination } from '../../../../[id]/interessados/_components/applicants-pagination'

import type { ApplicationStatus } from '../../../../[id]/interessados/_components/types'

import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { trpc } from '@/utils/trpc'

interface GroupApplicantsContentProps {
  groupId: string
  searchParams: {
    status?: string
    search?: string
    page?: string
  }
}

const SEARCH_DEBOUNCE_MS = 450

export function GroupApplicantsContent({
  groupId,
  searchParams,
}: GroupApplicantsContentProps) {
  const router = useRouter()
  const queryClient = useQueryClient()
  const [, startTransition] = useTransition()
  const [selectedApplicationId, setSelectedApplicationId] = useState<
    string | null
  >(null)

  const filters = useMemo(
    () => ({
      status: searchParams.status as ApplicationStatus | undefined,
      search: searchParams.search ?? '',
      page: parseInt(searchParams.page || '1', 10) || 1,
    }),
    [searchParams.status, searchParams.search, searchParams.page]
  )

  const [searchValue, setSearchValue] = useState(filters.search)

  const updateFilters = useCallback(
    (
      newFilters: Partial<{ status?: string; search?: string; page?: number }>,
      resetPage = true
    ) => {
      startTransition(() => {
        const merged = {
          ...filters,
          ...newFilters,
          page: resetPage ? 1 : (newFilters.page ?? filters.page),
        }

        const params = new URLSearchParams()
        if (merged.status) params.set('status', merged.status)
        if (merged.search && merged.search.trim().length > 0)
          params.set('search', merged.search.trim())
        if (merged.page > 1) params.set('page', String(merged.page))

        const queryString = params.toString()
        router.push(queryString ? `?${queryString}` : '?', { scroll: false })
      })
    },
    [filters, router]
  )

  useEffect(() => {
    setSearchValue(filters.search)
  }, [filters.search])

  useEffect(() => {
    if (searchValue === filters.search) return
    const timeoutId = window.setTimeout(() => {
      updateFilters({ search: searchValue || undefined })
    }, SEARCH_DEBOUNCE_MS)
    return () => window.clearTimeout(timeoutId)
  }, [searchValue, filters.search, updateFilters])

  const handlePageChange = useCallback(
    (page: number) => {
      updateFilters({ page }, false)
    },
    [updateFilters]
  )

  const listQuery = useQuery({
    ...trpc.applications.listByGroup.queryOptions({
      groupId,
      status: filters.status,
      search: filters.search || undefined,
      page: filters.page,
      limit: 15,
    }),
    placeholderData: keepPreviousData,
  })

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

  const clearAllFilters = useCallback(() => {
    updateFilters({ status: undefined, search: undefined })
  }, [updateFilters])

  const hasActiveFilters = Boolean(filters.status || filters.search)
  const data = listQuery.data

  if (listQuery.isLoading && !data) {
    return <ApplicantsLoadingSkeleton />
  }

  if (listQuery.isError) {
    return (
      <div className="border-destructive/20 bg-destructive/5 shadow-warm-sm rounded-xl border p-4 text-center">
        <p className="text-destructive inline-flex items-center gap-2 text-sm">
          <AlertTriangle className="h-4 w-4" />
          Erro ao carregar candidaturas.
          <button
            onClick={() => void listQuery.refetch()}
            className="underline hover:no-underline"
          >
            Tentar novamente
          </button>
        </p>
      </div>
    )
  }

  if (!data || data.applications.length === 0) {
    return (
      <div className="flex min-h-0 flex-1 flex-col gap-3">
        {/* Filter bar */}
        <div className="border-border/60 bg-card/95 shadow-warm-sm rounded-xl border p-2.5 sm:p-3">
          <div className="flex items-center gap-2">
            <Select
              value={filters.status || 'all'}
              onValueChange={(v) =>
                updateFilters({
                  status: v === 'all' ? undefined : v,
                })
              }
            >
              <SelectTrigger className="h-10 w-[190px] rounded-xl">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos</SelectItem>
                <SelectItem value="pending">Pendentes</SelectItem>
                <SelectItem value="reviewing">Em análise</SelectItem>
                <SelectItem value="approved">Aprovados</SelectItem>
                <SelectItem value="rejected">Rejeitados</SelectItem>
              </SelectContent>
            </Select>
            <div className="relative flex-1">
              <Search className="text-muted-foreground absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2" />
              <Input
                placeholder="Buscar por nome..."
                value={searchValue}
                onChange={(e) => setSearchValue(e.target.value)}
                className="h-10 rounded-xl pl-10"
              />
            </div>
          </div>
        </div>

        {/* Group info bar */}
        {data && (
          <GroupInfoBar
            group={data.group}
            total={data.pagination.total}
            isFetching={listQuery.isFetching}
          />
        )}

        <ApplicantsEmptyState
          hasFilters={hasActiveFilters}
          onClearFilters={clearAllFilters}
        />
      </div>
    )
  }

  return (
    <div className="flex min-h-0 flex-1 flex-col gap-3">
      {/* Filter bar */}
      <div className="border-border/60 bg-card/95 shadow-warm-sm shrink-0 rounded-xl border p-2.5 sm:p-3">
        <div className="flex items-center gap-2">
          <Select
            value={filters.status || 'all'}
            onValueChange={(v) =>
              updateFilters({
                status: v === 'all' ? undefined : v,
              })
            }
          >
            <SelectTrigger className="h-10 w-[190px] rounded-xl">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos</SelectItem>
              <SelectItem value="pending">Pendentes</SelectItem>
              <SelectItem value="reviewing">Em análise</SelectItem>
              <SelectItem value="approved">Aprovados</SelectItem>
              <SelectItem value="rejected">Rejeitados</SelectItem>
            </SelectContent>
          </Select>
          <div className="relative flex-1">
            <Search className="text-muted-foreground absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2" />
            <Input
              placeholder="Buscar por nome..."
              value={searchValue}
              onChange={(e) => setSearchValue(e.target.value)}
              className="h-10 rounded-xl pl-10"
            />
          </div>
        </div>
      </div>

      {/* Group info header */}
      <GroupInfoBar
        group={data.group}
        total={data.pagination.total}
        isFetching={listQuery.isFetching}
      />

      {/* Table */}
      <div className="min-h-0 flex-1">
        <ApplicantsDataTable
          applicants={data.applications}
          onOpenDetails={(applicationId) =>
            setSelectedApplicationId(applicationId)
          }
          onUpdateStatus={handleUpdateStatus}
          isUpdatingStatus={updateStatusMutation.isPending}
          updatingApplicationId={updatingApplicationId}
        />
      </div>

      {/* Pagination */}
      <div className="border-border/60 bg-card/95 shadow-warm-sm shrink-0 rounded-xl border px-2">
        <ApplicantsPagination
          page={data.pagination.page}
          totalPages={data.pagination.totalPages}
          onPageChange={handlePageChange}
        />
      </div>

      <ApplicantDetailsSheet
        open={Boolean(selectedApplicationId)}
        applicationId={selectedApplicationId}
        onOpenChange={(open) => {
          if (!open) setSelectedApplicationId(null)
        }}
      />
    </div>
  )
}

function GroupInfoBar({
  group,
  total,
  isFetching,
}: {
  group: {
    id: string
    cats: Array<{ id: string; name: string; photoUrl: string | null }>
  }
  total: number
  isFetching: boolean
}) {
  return (
    <div className="border-border/60 bg-card/95 shadow-warm-sm flex shrink-0 flex-wrap items-center justify-between gap-3 rounded-xl border px-3 py-2">
      <div className="flex min-w-0 items-center gap-2.5">
        <div className="flex -space-x-2">
          {group.cats.map((cat) =>
            cat.photoUrl ? (
              <img
                key={cat.id}
                src={cat.photoUrl}
                alt={cat.name}
                className="border-card h-9 w-9 rounded-xl border-2 object-cover"
              />
            ) : (
              <div
                key={cat.id}
                className="bg-muted text-muted-foreground border-card flex h-9 w-9 items-center justify-center rounded-xl border-2"
              >
                <CatIcon className="h-4 w-4" />
              </div>
            )
          )}
        </div>
        <div className="min-w-0">
          <p className="truncate text-sm font-semibold">
            {group.cats.map((c) => c.name).join(' & ')}
          </p>
          <p className="text-muted-foreground text-xs">
            {total} candidatura{total === 1 ? '' : 's'} confirmada
            {total === 1 ? '' : 's'}
          </p>
        </div>
      </div>

      <div className="flex items-center gap-2">
        <Badge variant="secondary" className="gap-1 rounded-full">
          <Users className="h-3 w-3" />
          Grupo
        </Badge>
        {isFetching && (
          <span className="text-muted-foreground inline-flex items-center gap-1.5 text-xs">
            <Loader2 className="h-3.5 w-3.5 animate-spin" />
            Atualizando...
          </span>
        )}
      </div>
    </div>
  )
}
