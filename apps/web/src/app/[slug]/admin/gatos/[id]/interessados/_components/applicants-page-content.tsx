'use client'

import { keepPreviousData, useQuery } from '@tanstack/react-query'
import { FilterX, X } from 'lucide-react'
import dynamic from 'next/dynamic'
import { useRouter } from 'next/navigation'
import { useCallback, useMemo, useState, useTransition } from 'react'

import { ApplicantDetailsSheet } from './applicant-details-sheet'
import { ApplicantsFilterBar } from './applicants-filter-bar'
import { ApplicantsList } from './applicants-list'
import {
  getDynamicFilterSummary,
  parseApplicantsFilters,
  serializeDynamicFilters,
} from './helpers'

import type { ApplicantsFilters, DynamicFilterInput } from './types'

import { Button } from '@/components/ui/button'
import { trpc } from '@/utils/trpc'

const ApplicantsFilterDrawer = dynamic(
  () =>
    import('./applicants-filter-drawer').then((m) => m.ApplicantsFilterDrawer),
  { ssr: false }
)

interface ApplicantsPageContentProps {
  catId: string
  searchParams: {
    status?: string
    search?: string
    page?: string
    dynamicFilters?: string
  }
}

export function ApplicantsPageContent({
  catId,
  searchParams,
}: ApplicantsPageContentProps) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [selectedApplicationId, setSelectedApplicationId] = useState<
    string | null
  >(null)

  const filters = useMemo(
    () => parseApplicantsFilters(searchParams),
    [searchParams]
  )

  const listQuery = useQuery({
    ...trpc.applications.listByCat.queryOptions({
      catId,
      status: filters.status,
      search: filters.search,
      page: filters.page,
      limit: 15,
      dynamicFilters: filters.dynamicFilters,
    }),
    placeholderData: keepPreviousData,
  })

  const activeDynamicFiltersCount = filters.dynamicFilters.length

  const updateFilters = useCallback(
    (newFilters: Partial<ApplicantsFilters>, resetPage = true) => {
      startTransition(() => {
        const merged: ApplicantsFilters = {
          ...filters,
          ...newFilters,
          dynamicFilters: newFilters.dynamicFilters ?? filters.dynamicFilters,
          page: resetPage ? 1 : (newFilters.page ?? filters.page),
        }

        const params = new URLSearchParams()

        if (merged.status) {
          params.set('status', merged.status)
        }

        if (merged.search && merged.search.trim().length > 0) {
          params.set('search', merged.search.trim())
        }

        if (merged.dynamicFilters.length > 0) {
          params.set(
            'dynamicFilters',
            serializeDynamicFilters(merged.dynamicFilters)
          )
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
      dynamicFilters: [],
    })
  }, [updateFilters])

  const handleApplyDynamicFilters = useCallback(
    (dynamicFilters: DynamicFilterInput[]) => {
      updateFilters({ dynamicFilters })
      setDrawerOpen(false)
    },
    [updateFilters]
  )

  const handleClearDynamicFilters = useCallback(() => {
    updateFilters({ dynamicFilters: [] })
    setDrawerOpen(false)
  }, [updateFilters])

  const handleRemoveDynamicFilter = useCallback(
    (fieldId: string) => {
      updateFilters({
        dynamicFilters: filters.dynamicFilters.filter(
          (filter) => filter.fieldId !== fieldId
        ),
      })
    },
    [filters.dynamicFilters, updateFilters]
  )

  const hasActiveFilters = Boolean(
    filters.status || filters.search || filters.dynamicFilters.length > 0
  )

  return (
    <div className="flex min-h-0 flex-1 flex-col gap-3">
      <div className="shrink-0">
        <ApplicantsFilterBar
          filters={filters}
          onFilterChange={updateFilters}
          onOpenAdvanced={() => setDrawerOpen(true)}
          activeDynamicFiltersCount={activeDynamicFiltersCount}
          isPending={isPending}
        />
      </div>

      {filters.dynamicFilters.length > 0 && (
        <div className="border-border/60 bg-card/95 shadow-warm-sm flex flex-wrap items-center gap-2 rounded-xl border px-3 py-2">
          {filters.dynamicFilters.map((filter) => (
            <span
              key={filter.fieldId}
              className="bg-muted text-foreground inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs"
            >
              {getDynamicFilterSummary(
                filter,
                listQuery.data?.filterableFields ?? []
              )}
              <button
                type="button"
                onClick={() => handleRemoveDynamicFilter(filter.fieldId)}
                className="text-muted-foreground hover:text-foreground"
                aria-label="Remover filtro"
              >
                <X className="h-3 w-3" />
              </button>
            </span>
          ))}

          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="h-7 rounded-lg px-2 text-xs"
            onClick={handleClearDynamicFilters}
          >
            <FilterX className="mr-1.5 h-3.5 w-3.5" />
            Limpar filtros dinâmicos
          </Button>
        </div>
      )}

      <ApplicantsList
        data={listQuery.data}
        isLoading={listQuery.isLoading}
        isFetching={listQuery.isFetching}
        isError={listQuery.isError}
        refetch={() => {
          void listQuery.refetch()
        }}
        hasFilters={hasActiveFilters}
        onClearFilters={clearAllFilters}
        onPageChange={handlePageChange}
        onOpenDetails={(applicationId) =>
          setSelectedApplicationId(applicationId)
        }
      />

      <ApplicantsFilterDrawer
        open={drawerOpen}
        onOpenChange={setDrawerOpen}
        filterableFields={listQuery.data?.filterableFields ?? []}
        dynamicFilters={filters.dynamicFilters}
        onApply={handleApplyDynamicFilters}
        onClear={handleClearDynamicFilters}
      />

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
