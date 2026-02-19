'use client'

import { format, parse } from 'date-fns'
import { Search, X } from 'lucide-react'
import { useEffect, useState } from 'react'

import type { AdoptionsFilters } from './adoptions-page-content'

import { Button } from '@/components/ui/button'
import { DatePicker } from '@/components/ui/date-picker'
import { Input } from '@/components/ui/input'

interface AdoptionsFilterBarProps {
  filters: AdoptionsFilters
  onFilterChange: (filters: Partial<AdoptionsFilters>) => void
  isPending?: boolean
}

const SEARCH_DEBOUNCE_MS = 450

function parseDate(dateStr: string | undefined): Date | undefined {
  if (!dateStr) return undefined
  try {
    return parse(dateStr, 'yyyy-MM-dd', new Date())
  } catch {
    return undefined
  }
}

function formatDateForUrl(date: Date | undefined): string | undefined {
  if (!date) return undefined
  return format(date, 'yyyy-MM-dd')
}

export function AdoptionsFilterBar({
  filters,
  onFilterChange,
  isPending,
}: AdoptionsFilterBarProps) {
  const [searchValue, setSearchValue] = useState(filters.search || '')

  // Sync with URL changes
  useEffect(() => {
    setSearchValue(filters.search || '')
  }, [filters.search])

  // Debounce search
  useEffect(() => {
    const currentSearch = filters.search || ''
    if (searchValue === currentSearch) return

    const timeoutId = window.setTimeout(() => {
      onFilterChange({ search: searchValue || undefined })
    }, SEARCH_DEBOUNCE_MS)

    return () => window.clearTimeout(timeoutId)
  }, [searchValue, filters.search, onFilterChange])

  const handleDateFromChange = (date: Date | undefined) => {
    onFilterChange({ dateFrom: formatDateForUrl(date) })
  }

  const handleDateToChange = (date: Date | undefined) => {
    onFilterChange({ dateTo: formatDateForUrl(date) })
  }

  const hasFilters = searchValue || filters.dateFrom || filters.dateTo

  const clearAllFilters = () => {
    setSearchValue('')
    onFilterChange({
      search: undefined,
      dateFrom: undefined,
      dateTo: undefined,
    })
  }

  const dateFrom = parseDate(filters.dateFrom)
  const dateTo = parseDate(filters.dateTo)

  return (
    <div className="border-border/60 bg-card/95 shadow-warm-sm rounded-xl border p-2.5 sm:p-3">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
        {/* Search - flex-1 on desktop */}
        <div className="relative sm:flex-1">
          <Search className="text-muted-foreground absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2" />
          <Input
            type="text"
            placeholder="Buscar por nome..."
            value={searchValue}
            onChange={(e) => setSearchValue(e.target.value)}
            className="h-10 rounded-xl pl-10"
            disabled={isPending}
          />
        </div>

        {/* Date Range */}
        <div className="flex items-center gap-2">
          <DatePicker
            value={dateFrom}
            onChange={handleDateFromChange}
            placeholder="De"
            disabled={isPending}
            toDate={dateTo}
            className="w-full sm:w-[130px]"
          />
          <span className="text-muted-foreground text-xs">até</span>
          <DatePicker
            value={dateTo}
            onChange={handleDateToChange}
            placeholder="Até"
            disabled={isPending}
            fromDate={dateFrom}
            className="w-full sm:w-[130px]"
          />
        </div>

        {/* Clear Filters */}
        {hasFilters && (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={clearAllFilters}
            className="text-muted-foreground hover:text-foreground shrink-0 gap-1.5 rounded-lg"
            disabled={isPending}
          >
            <X className="h-3.5 w-3.5" />
            Limpar
          </Button>
        )}
      </div>
    </div>
  )
}
