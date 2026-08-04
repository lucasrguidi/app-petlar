'use client'

import { Search } from 'lucide-react'
import { useEffect, useState } from 'react'

import type { ApplicationStatus } from '../../gatos/[id]/interessados/_components/types'

import { Checkbox } from '@/components/ui/checkbox'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

export interface CandidaturasFilters {
  status?: ApplicationStatus
  search?: string
  includeAdopted?: boolean
  page: number
}

interface CandidaturasFilterBarProps {
  filters: CandidaturasFilters
  onFilterChange: (filters: Partial<CandidaturasFilters>) => void
  isPending: boolean
}

const SEARCH_DEBOUNCE_MS = 450

export function CandidaturasFilterBar({
  filters,
  onFilterChange,
  isPending,
}: CandidaturasFilterBarProps) {
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
                    : (value as ApplicationStatus),
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
              <SelectItem value="permanently_rejected">
                Rejeição permanente
              </SelectItem>
            </SelectContent>
          </Select>
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

        <div className="col-span-2 flex items-center gap-2 sm:order-3">
          <Checkbox
            id="include-adopted"
            checked={filters.includeAdopted ?? false}
            onCheckedChange={(checked) =>
              onFilterChange({ includeAdopted: checked === true || undefined })
            }
            disabled={isPending}
          />
          <Label
            htmlFor="include-adopted"
            className="text-muted-foreground cursor-pointer text-xs"
          >
            Incluir adotados
          </Label>
        </div>
      </div>
    </div>
  )
}
