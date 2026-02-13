'use client'

import { useRouter, useSearchParams } from 'next/navigation'
import { useCallback, useMemo, useTransition } from 'react'

import { FormsFilterBar } from './forms-filter-bar'
import { FormsList } from './forms-list'

export interface FormsFilters {
  status?: string
  search?: string
}

export function FormsPageContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [isPending, startTransition] = useTransition()

  const filters: FormsFilters = useMemo(
    () => ({
      status: searchParams.get('status') || undefined,
      search: searchParams.get('search') || undefined,
    }),
    [searchParams]
  )

  const updateFilters = useCallback(
    (newFilters: Partial<FormsFilters>) => {
      startTransition(() => {
        const params = new URLSearchParams(searchParams.toString())
        const merged = { ...filters, ...newFilters }

        // Update or remove each filter param
        Object.entries(merged).forEach(([key, value]) => {
          if (value && value !== '') {
            params.set(key, String(value))
          } else {
            params.delete(key)
          }
        })

        const queryString = params.toString()
        router.push(queryString ? `?${queryString}` : '?', { scroll: false })
      })
    },
    [filters, router, searchParams]
  )

  const clearFilters = useCallback(() => {
    updateFilters({ status: undefined, search: undefined })
  }, [updateFilters])

  return (
    <div className="flex min-h-0 flex-1 flex-col gap-3">
      <FormsFilterBar
        filters={filters}
        onFilterChange={updateFilters}
        isPending={isPending}
      />
      <FormsList filters={filters} onClearFilters={clearFilters} />
    </div>
  )
}
