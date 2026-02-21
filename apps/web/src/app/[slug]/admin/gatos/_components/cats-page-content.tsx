'use client'

import dynamic from 'next/dynamic'
import { useRouter } from 'next/navigation'
import { useCallback, useEffect, useMemo, useState, useTransition } from 'react'

import { CatsFilterBar } from './cats-filter-bar'
import { CatsList } from './cats-list'

// Dynamic import do drawer (bundle optimization)
const CatsFilterDrawer = dynamic(
  () => import('./cats-filter-drawer').then((m) => m.CatsFilterDrawer),
  { ssr: false }
)

export interface CatsFilters {
  status?: CatStatusFilter
  sex?: string
  fiv?: string
  felv?: string
  castrated?: string
  search?: string
  page: number
}

export type CatStatusFilter = 'available' | 'in_progress'

function isValidStatusFilter(value: string): value is CatStatusFilter {
  return value === 'available' || value === 'in_progress'
}

interface CatsPageContentProps {
  searchParams: {
    status?: string
    sex?: string
    fiv?: string
    felv?: string
    castrated?: string
    search?: string
    page?: string
  }
}

export function CatsPageContent({ searchParams }: CatsPageContentProps) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [drawerOpen, setDrawerOpen] = useState(false)
  const shouldCleanLegacyStatus =
    searchParams.status !== undefined &&
    !isValidStatusFilter(searchParams.status)

  useEffect(() => {
    if (!shouldCleanLegacyStatus) return

    const params = new URLSearchParams()

    const filtersToKeep = [
      ['sex', searchParams.sex],
      ['fiv', searchParams.fiv],
      ['felv', searchParams.felv],
      ['castrated', searchParams.castrated],
      ['search', searchParams.search],
    ] as const

    filtersToKeep.forEach(([key, value]) => {
      if (value && value !== '') {
        params.set(key, value)
      }
    })

    const page = parseInt(searchParams.page || '1', 10)
    if (Number.isFinite(page) && page > 1) {
      params.set('page', String(page))
    }

    const queryString = params.toString()
    router.replace(queryString ? `?${queryString}` : '?', { scroll: false })
  }, [
    router,
    shouldCleanLegacyStatus,
    searchParams.sex,
    searchParams.fiv,
    searchParams.felv,
    searchParams.castrated,
    searchParams.search,
    searchParams.page,
  ])

  // Parse filters from URL - memoized to prevent unnecessary re-renders
  const filters: CatsFilters = useMemo(
    () => ({
      status:
        searchParams.status && isValidStatusFilter(searchParams.status)
          ? searchParams.status
          : undefined,
      sex: searchParams.sex,
      fiv: searchParams.fiv,
      felv: searchParams.felv,
      castrated: searchParams.castrated,
      search: searchParams.search || '',
      page: parseInt(searchParams.page || '1', 10) || 1,
    }),
    [
      searchParams.status,
      searchParams.sex,
      searchParams.fiv,
      searchParams.felv,
      searchParams.castrated,
      searchParams.search,
      searchParams.page,
    ]
  )

  // Count active advanced filters
  const activeAdvancedFiltersCount = [
    filters.sex,
    filters.fiv,
    filters.felv,
    filters.castrated,
  ].filter(Boolean).length

  // Stable callback com useTransition
  const updateFilters = useCallback(
    (newFilters: Partial<CatsFilters>, resetPage = true) => {
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

        // Only set page if > 1
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

  const clearAdvancedFilters = useCallback(() => {
    updateFilters({
      sex: undefined,
      fiv: undefined,
      felv: undefined,
      castrated: undefined,
    })
  }, [updateFilters])

  return (
    <div className="flex min-h-0 flex-1 flex-col gap-3">
      <div className="shrink-0">
        <CatsFilterBar
          filters={filters}
          onFilterChange={updateFilters}
          onOpenAdvanced={() => setDrawerOpen(true)}
          activeAdvancedFiltersCount={activeAdvancedFiltersCount}
          isPending={isPending}
        />
      </div>

      <CatsList
        filters={filters}
        onPageChange={handlePageChange}
        onClearFilters={() =>
          updateFilters({
            status: undefined,
            sex: undefined,
            fiv: undefined,
            felv: undefined,
            castrated: undefined,
            search: undefined,
          })
        }
      />

      <CatsFilterDrawer
        open={drawerOpen}
        onOpenChange={setDrawerOpen}
        filters={filters}
        onApply={(newFilters) => {
          updateFilters(newFilters)
          setDrawerOpen(false)
        }}
        onClear={() => {
          clearAdvancedFilters()
          setDrawerOpen(false)
        }}
      />
    </div>
  )
}
