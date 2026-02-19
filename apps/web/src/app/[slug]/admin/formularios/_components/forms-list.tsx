'use client'

import { useQuery } from '@tanstack/react-query'
import { AlertTriangle, FileText, Loader2 } from 'lucide-react'
import { useMemo } from 'react'

import { FormCard } from './form-card'
import { FormsEmptyState } from './forms-empty-state'
import { FormsListSkeleton } from './forms-loading-skeleton'

import type { FormsFilters } from './forms-page-content'

import { Button } from '@/components/ui/button'
import { trpc } from '@/utils/trpc'

interface FormsListProps {
  filters: FormsFilters
  onClearFilters: () => void
}

export function FormsList({ filters, onClearFilters }: FormsListProps) {
  const { data, isLoading, isFetching, isError, refetch } = useQuery(
    trpc.forms.list.queryOptions()
  )

  // Client-side filtering
  const filteredForms = useMemo(() => {
    if (!data) return []

    return data.filter((form) => {
      // Status filter
      if (filters.status === 'active' && !form.active) return false
      if (filters.status === 'inactive' && form.active) return false

      // Search filter
      if (filters.search) {
        const search = filters.search.toLowerCase()
        if (!form.name.toLowerCase().includes(search)) return false
      }

      return true
    })
  }, [data, filters])

  const hasActiveFilters = Boolean(filters.status || filters.search)

  if (isLoading && !data) {
    return <FormsListSkeleton />
  }

  if (isError) {
    return (
      <div className="border-destructive/20 bg-destructive/5 shadow-warm-sm rounded-xl border p-4 text-center">
        <p className="text-destructive inline-flex items-center gap-2 text-sm">
          <AlertTriangle className="h-4 w-4" />
          Erro ao carregar formulários.
        </p>
        <Button
          variant="outline"
          size="sm"
          className="ml-2 rounded-lg"
          onClick={() => refetch()}
        >
          Tentar novamente
        </Button>
      </div>
    )
  }

  if (filteredForms.length === 0) {
    return (
      <FormsEmptyState
        hasFilters={hasActiveFilters}
        onClearFilters={onClearFilters}
      />
    )
  }

  return (
    <div className="flex min-h-0 flex-1 flex-col gap-3">
      {/* Results count */}
      <div className="border-border/60 bg-card/95 shadow-warm-sm flex shrink-0 items-center justify-between rounded-xl border px-3 py-2">
        <p className="text-muted-foreground inline-flex items-center gap-2 text-sm font-medium">
          <FileText className="text-primary h-4 w-4" />
          {filteredForms.length} formulário
          {filteredForms.length !== 1 && 's'} encontrado
          {filteredForms.length !== 1 && 's'}
        </p>
        {isFetching && (
          <span className="text-muted-foreground inline-flex items-center gap-1.5 text-xs">
            <Loader2 className="h-3.5 w-3.5 animate-spin" />
            Atualizando...
          </span>
        )}
      </div>

      {/* Form cards */}
      <div className="min-h-0 flex-1 space-y-3 overflow-auto">
        {filteredForms.map((form, index) => (
          <div
            key={form.id}
            className="animate-fade-in-up"
            style={{ animationDelay: `${index * 50}ms` }}
          >
            <FormCard form={form} />
          </div>
        ))}
      </div>
    </div>
  )
}
