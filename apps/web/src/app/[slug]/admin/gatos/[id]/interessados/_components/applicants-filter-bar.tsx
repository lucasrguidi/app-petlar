'use client'

import { Search, SlidersHorizontal } from 'lucide-react'
import { useEffect, useState } from 'react'

import type { ApplicantsFilters } from './types'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

interface ApplicantsFilterBarProps {
  filters: ApplicantsFilters
  onFilterChange: (filters: Partial<ApplicantsFilters>) => void
  onOpenAdvanced: () => void
  activeDynamicFiltersCount: number
  isPending: boolean
}

const SEARCH_DEBOUNCE_MS = 450

export function ApplicantsFilterBar({
  filters,
  onFilterChange,
  onOpenAdvanced,
  activeDynamicFiltersCount,
  isPending,
}: ApplicantsFilterBarProps) {
  const [searchValue, setSearchValue] = useState(filters.search || '')

  useEffect(() => {
    setSearchValue(filters.search || '')
  }, [filters.search])

  useEffect(() => {
    const currentSearch = filters.search || ''
    if (searchValue === currentSearch) return

    const timeoutId = window.setTimeout(() => {
      onFilterChange({ search: searchValue || undefined })
    }, SEARCH_DEBOUNCE_MS)

    return () => window.clearTimeout(timeoutId)
  }, [searchValue, filters.search, onFilterChange])

  return (
    <div className="border-border/60 bg-card/95 shadow-warm-sm rounded-xl border p-2.5 sm:p-3">
      <div className="grid grid-cols-[minmax(0,1fr)_auto] gap-2 sm:flex sm:items-center">
        <div className="sm:order-1">
          <Select
            value={filters.status || 'all'}
            onValueChange={(value: string) =>
              onFilterChange({
                status:
                  value === 'all'
                    ? undefined
                    : (value as ApplicantsFilters['status']),
              })
            }
            disabled={isPending}
          >
            <SelectTrigger className="h-10 w-full rounded-xl sm:w-[190px]">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos os status</SelectItem>
              <SelectItem value="pending">Pendente</SelectItem>
              <SelectItem value="reviewing">Em análise</SelectItem>
              <SelectItem value="approved">Aprovado</SelectItem>
              <SelectItem value="rejected">Recusado</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="sm:order-3">
          <Button
            variant="outline"
            onClick={onOpenAdvanced}
            disabled={isPending}
            className="border-border/60 bg-card hover:bg-sidebar-accent relative h-10 gap-2 rounded-xl px-3"
          >
            <SlidersHorizontal className="h-4 w-4" />
            Filtros
            {activeDynamicFiltersCount > 0 && (
              <span className="bg-primary text-primary-foreground absolute -top-1 -right-1 flex h-4 min-w-4 items-center justify-center rounded-full text-[10px] font-bold">
                {activeDynamicFiltersCount}
              </span>
            )}
          </Button>
        </div>

        <div className="relative col-span-2 sm:order-2 sm:flex-1">
          <Search className="text-muted-foreground absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2" />
          <Input
            placeholder="Buscar por nome..."
            value={searchValue}
            onChange={(event) => setSearchValue(event.target.value)}
            className="h-10 rounded-xl pl-10"
          />
        </div>
      </div>
    </div>
  )
}
