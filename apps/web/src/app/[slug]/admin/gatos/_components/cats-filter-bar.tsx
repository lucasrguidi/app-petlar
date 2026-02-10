'use client'

import { Search, SlidersHorizontal } from 'lucide-react'
import { useCallback, useEffect, useState } from 'react'

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

  // Debounce search
  const handleSearchChange = useCallback(
    (value: string) => {
      setSearchValue(value)

      // Debounce
      const timeoutId = setTimeout(() => {
        onFilterChange({ search: value || undefined })
      }, 300)

      return () => clearTimeout(timeoutId)
    },
    [onFilterChange]
  )

  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
      {/* Status Select */}
      <Select
        value={filters.status || 'all'}
        onValueChange={(value: string) =>
          onFilterChange({ status: value === 'all' ? undefined : value })
        }
        disabled={isPending}
      >
        <SelectTrigger className="h-10 w-full rounded-lg sm:w-[160px]">
          <SelectValue placeholder="Status" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">Todos os status</SelectItem>
          <SelectItem value="available">Disponível</SelectItem>
          <SelectItem value="in_progress">Em processo</SelectItem>
          <SelectItem value="adopted">Adotado</SelectItem>
        </SelectContent>
      </Select>

      {/* Search Input with Icon */}
      <div className="relative flex-1">
        <Search className="text-muted-foreground absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2" />
        <Input
          placeholder="Buscar gato..."
          value={searchValue}
          onChange={(e) => handleSearchChange(e.target.value)}
          disabled={isPending}
          className="h-10 rounded-lg pl-10"
        />
      </div>

      {/* Advanced Filters Button */}
      <Button
        variant="outline"
        size="icon"
        onClick={onOpenAdvanced}
        disabled={isPending}
        className="relative h-10 w-10 shrink-0 rounded-lg"
      >
        <SlidersHorizontal className="h-4 w-4" />
        {/* Badge for active filter count */}
        {activeAdvancedFiltersCount > 0 && (
          <span className="bg-primary text-primary-foreground absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full text-[10px] font-bold">
            {activeAdvancedFiltersCount}
          </span>
        )}
      </Button>
    </div>
  )
}
