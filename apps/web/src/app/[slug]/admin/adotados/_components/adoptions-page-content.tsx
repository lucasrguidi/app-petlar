'use client'

import { useRouter } from 'next/navigation'
import { useCallback, useMemo, useTransition } from 'react'

import { AdoptionsFilterBar } from './adoptions-filter-bar'
import { AdoptionsList } from './adoptions-list'

export interface AdoptionsFilters {
  search?: string
  dateFrom?: string
  dateTo?: string
  page: number
}

interface AdoptionsPageContentProps {
  searchParams: {
    search?: string
    dateFrom?: string
    dateTo?: string
    page?: string
  }
}

export function AdoptionsPageContent({
  searchParams,
}: AdoptionsPageContentProps) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()

  const filters: AdoptionsFilters = useMemo(
    () => ({
      search: searchParams.search || '',
      dateFrom: searchParams.dateFrom,
      dateTo: searchParams.dateTo,
      page: parseInt(searchParams.page || '1', 10) || 1,
    }),
    [
      searchParams.search,
      searchParams.dateFrom,
      searchParams.dateTo,
      searchParams.page,
    ]
  )

  const updateFilters = useCallback(
    (newFilters: Partial<AdoptionsFilters>, resetPage = true) => {
      startTransition(() => {
        const params = new URLSearchParams()
        const merged = {
          ...filters,
          ...newFilters,
          page: resetPage ? 1 : (newFilters.page ?? filters.page),
        }

        Object.entries(merged).forEach(([key, value]) => {
          if (value && value !== '' && key !== 'page') {
            params.set(key, String(value))
          }
        })

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
    (newPage: number) => {
      updateFilters({ page: newPage }, false)
    },
    [updateFilters]
  )

  const clearAllFilters = useCallback(() => {
    updateFilters({
      search: undefined,
      dateFrom: undefined,
      dateTo: undefined,
    })
  }, [updateFilters])

  return (
    <div className="flex min-h-0 flex-1 flex-col gap-3">
      {/* Filter bar first - consistent with gatos */}
      <div className="shrink-0">
        <AdoptionsFilterBar
          filters={filters}
          onFilterChange={updateFilters}
          isPending={isPending}
        />
      </div>

      {/* List with stats inside */}
      <AdoptionsList
        filters={filters}
        onPageChange={handlePageChange}
        onClearFilters={clearAllFilters}
      />
    </div>
  )
}
