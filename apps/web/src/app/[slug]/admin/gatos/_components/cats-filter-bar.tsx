'use client'

import { Search, SlidersHorizontal } from 'lucide-react'
import { useEffect, useState } from 'react'

import type { CatsFilters } from './cats-page-content'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

interface CatsFilterBarProps {
  filters: CatsFilters
  onFilterChange: (filters: Partial<CatsFilters>) => void
  onOpenAdvanced: () => void
  activeAdvancedFiltersCount: number
  isPending: boolean
}

const SEARCH_DEBOUNCE_MS = 450

export function CatsFilterBar({
  filters,
  onFilterChange,
  onOpenAdvanced,
  activeAdvancedFiltersCount,
  isPending,
}: CatsFilterBarProps) {
  const [searchValue, setSearchValue] = useState(filters.search || '')

  // Sync search value with filters
  useEffect(() => {
    setSearchValue(filters.search || '')
  }, [filters.search])

  // Debounce search with cleanup to avoid firing requests on every keystroke
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
            onValueChange={(value: string) => {
              if (value === 'all') {
                onFilterChange({ status: undefined })
                return
              }

              if (value === 'available' || value === 'in_progress') {
                onFilterChange({ status: value })
              }
            }}
            disabled={isPending}
          >
            <SelectTrigger className="h-10 w-full rounded-xl sm:w-[190px]">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos os status</SelectItem>
              <SelectItem value="available">Disponível</SelectItem>
              <SelectItem value="in_progress">Em processo</SelectItem>
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
            {activeAdvancedFiltersCount > 0 && (
              <span className="bg-primary text-primary-foreground absolute -top-1 -right-1 flex h-4 min-w-4 items-center justify-center rounded-full text-[10px] font-bold">
                {activeAdvancedFiltersCount}
              </span>
            )}
          </Button>
        </div>

        <div className="relative col-span-2 sm:order-2 sm:flex-1">
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
  )
}
