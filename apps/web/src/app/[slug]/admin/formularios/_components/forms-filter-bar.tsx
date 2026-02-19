'use client'

import { Search } from 'lucide-react'
import { useEffect, useState } from 'react'

import type { FormsFilters } from './forms-page-content'

import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

interface FormsFilterBarProps {
  filters: FormsFilters
  onFilterChange: (filters: Partial<FormsFilters>) => void
  isPending: boolean
}

const SEARCH_DEBOUNCE_MS = 450

export function FormsFilterBar({
  filters,
  onFilterChange,
  isPending,
}: FormsFilterBarProps) {
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
    <div className="border-border/60 bg-card/95 shadow-warm-sm shrink-0 rounded-xl border p-2.5 sm:p-3">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
        <Select
          value={filters.status || 'all'}
          onValueChange={(value: string) =>
            onFilterChange({ status: value === 'all' ? undefined : value })
          }
          disabled={isPending}
        >
          <SelectTrigger className="h-10 w-full rounded-xl sm:w-[180px]">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos os status</SelectItem>
            <SelectItem value="active">Ativos</SelectItem>
            <SelectItem value="inactive">Inativos</SelectItem>
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
  )
}
