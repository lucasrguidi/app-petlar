'use client'

import {
  endOfMonth,
  format,
  isAfter,
  isBefore,
  isValid,
  parse,
  startOfDay,
  startOfMonth,
  subDays,
} from 'date-fns'
import { CalendarRange, Search, X } from 'lucide-react'
import { useEffect, useState } from 'react'

import type { AdoptionsFilters } from './adoptions-page-content'

import { Button } from '@/components/ui/button'
import { DatePicker } from '@/components/ui/date-picker'
import { Input } from '@/components/ui/input'
import { cn } from '@/lib/utils'

interface AdoptionsFilterBarProps {
  filters: AdoptionsFilters
  onFilterChange: (filters: Partial<AdoptionsFilters>) => void
  isPending?: boolean
}

const SEARCH_DEBOUNCE_MS = 450
type DatePreset = 'today' | 'last7' | 'last30' | 'thisMonth'

const DATE_PRESETS: Array<{ key: DatePreset; label: string }> = [
  { key: 'today', label: 'Hoje' },
  { key: 'last7', label: '7 dias' },
  { key: 'last30', label: '30 dias' },
  { key: 'thisMonth', label: 'Mês atual' },
]

function parseDate(dateStr: string | undefined): Date | undefined {
  if (!dateStr) return undefined
  const parsedDate = parse(dateStr, 'yyyy-MM-dd', new Date())
  return isValid(parsedDate) ? parsedDate : undefined
}

function formatDateForUrl(date: Date | undefined): string | undefined {
  if (!date) return undefined
  return format(date, 'yyyy-MM-dd')
}

function getPresetRange(
  preset: DatePreset,
  referenceDate = new Date()
): { from: Date; to: Date } {
  const today = startOfDay(referenceDate)

  if (preset === 'today') {
    return { from: today, to: today }
  }

  if (preset === 'last7') {
    return { from: subDays(today, 6), to: today }
  }

  if (preset === 'last30') {
    return { from: subDays(today, 29), to: today }
  }

  return {
    from: startOfMonth(today),
    to: endOfMonth(today),
  }
}

function isActivePreset(
  preset: DatePreset,
  dateFrom: string | undefined,
  dateTo: string | undefined
): boolean {
  const { from, to } = getPresetRange(preset)
  return dateFrom === formatDateForUrl(from) && dateTo === formatDateForUrl(to)
}

export function AdoptionsFilterBar({
  filters,
  onFilterChange,
  isPending,
}: AdoptionsFilterBarProps) {
  const [searchValue, setSearchValue] = useState(filters.search || '')
  const dateFrom = parseDate(filters.dateFrom)
  const dateTo = parseDate(filters.dateTo)

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
    const nextDateFrom = formatDateForUrl(date)

    if (!date || !dateTo || !isAfter(date, dateTo)) {
      onFilterChange({ dateFrom: nextDateFrom })
      return
    }

    onFilterChange({ dateFrom: nextDateFrom, dateTo: nextDateFrom })
  }

  const handleDateToChange = (date: Date | undefined) => {
    const nextDateTo = formatDateForUrl(date)

    if (!date || !dateFrom || !isBefore(date, dateFrom)) {
      onFilterChange({ dateTo: nextDateTo })
      return
    }

    onFilterChange({ dateFrom: nextDateTo, dateTo: nextDateTo })
  }

  const applyPreset = (preset: DatePreset) => {
    const { from, to } = getPresetRange(preset)
    onFilterChange({
      dateFrom: formatDateForUrl(from),
      dateTo: formatDateForUrl(to),
    })
  }

  const hasFilters = Boolean(searchValue || filters.dateFrom || filters.dateTo)

  const clearAllFilters = () => {
    setSearchValue('')
    onFilterChange({
      search: undefined,
      dateFrom: undefined,
      dateTo: undefined,
    })
  }

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
        <div className="flex shrink-0 flex-col gap-1.5">
          <div className="border-border/60 bg-muted/20 rounded-xl border p-1.5">
            <div className="grid grid-cols-[auto_minmax(0,1fr)_auto_minmax(0,1fr)] items-center gap-1.5">
              <CalendarRange className="text-primary/70 h-4 w-4 shrink-0" />
              <DatePicker
                value={dateFrom}
                onChange={handleDateFromChange}
                placeholder="De"
                disabled={isPending}
                toDate={dateTo}
                className="hover:border-border/60 hover:bg-muted hover:text-foreground h-9 min-w-0 sm:w-[130px]"
              />
              <span className="text-muted-foreground px-0.5 text-xs">até</span>
              <DatePicker
                value={dateTo}
                onChange={handleDateToChange}
                placeholder="Até"
                disabled={isPending}
                fromDate={dateFrom}
                className="hover:border-border/60 hover:bg-muted hover:text-foreground h-9 min-w-0 sm:w-[130px]"
              />
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-1">
            {DATE_PRESETS.map((preset) => (
              <Button
                key={preset.key}
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => applyPreset(preset.key)}
                disabled={isPending}
                className={cn(
                  'h-7 rounded-lg px-2 text-[11px]',
                  isActivePreset(
                    preset.key,
                    filters.dateFrom,
                    filters.dateTo
                  ) &&
                    'bg-primary/12 text-primary hover:bg-primary/18 hover:text-primary'
                )}
                aria-label={`Filtrar por ${preset.label.toLowerCase()}`}
              >
                {preset.label}
              </Button>
            ))}
          </div>
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
