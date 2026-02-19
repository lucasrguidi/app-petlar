'use client'

import { Check, FilterX, SlidersHorizontal } from 'lucide-react'
import { useMemo, useState } from 'react'

import type {
  DynamicFilterInput,
  DynamicFilterOperator,
  FilterableField,
} from './types'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet'

interface ApplicantsFilterDrawerProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  filterableFields: FilterableField[]
  dynamicFilters: DynamicFilterInput[]
  onApply: (filters: DynamicFilterInput[]) => void
  onClear: () => void
}

const DATE_OPERATORS: DynamicFilterOperator[] = ['equals', 'before', 'after']
const TEXT_OPERATORS: DynamicFilterOperator[] = ['contains', 'equals']

function getFilterByField(
  filters: DynamicFilterInput[],
  fieldId: string
): DynamicFilterInput | undefined {
  return filters.find((item) => item.fieldId === fieldId)
}

function sanitizeFilters(filters: DynamicFilterInput[]): DynamicFilterInput[] {
  return filters.filter((filter) => {
    if (typeof filter.value === 'boolean') return true
    return filter.value.trim().length > 0
  })
}

export function ApplicantsFilterDrawer({
  open,
  onOpenChange,
  filterableFields,
  dynamicFilters,
  onApply,
  onClear,
}: ApplicantsFilterDrawerProps) {
  const [localFilters, setLocalFilters] =
    useState<DynamicFilterInput[]>(dynamicFilters)

  const filtersByField = useMemo(
    () => new Map(localFilters.map((filter) => [filter.fieldId, filter])),
    [localFilters]
  )

  const handleOpenChange = (nextOpen: boolean) => {
    if (nextOpen) {
      setLocalFilters(dynamicFilters)
    }
    onOpenChange(nextOpen)
  }

  const upsertFilter = (nextFilter: DynamicFilterInput) => {
    setLocalFilters((current) => {
      const hasFilter = current.some(
        (filter) => filter.fieldId === nextFilter.fieldId
      )

      if (!hasFilter) {
        return [...current, nextFilter]
      }

      return current.map((filter) =>
        filter.fieldId === nextFilter.fieldId ? nextFilter : filter
      )
    })
  }

  const removeFilter = (fieldId: string) => {
    setLocalFilters((current) =>
      current.filter((filter) => filter.fieldId !== fieldId)
    )
  }

  const handleTextOperatorChange = (
    fieldId: string,
    operator: DynamicFilterOperator
  ) => {
    const currentFilter = getFilterByField(localFilters, fieldId)
    const currentValue =
      currentFilter && typeof currentFilter.value === 'string'
        ? currentFilter.value
        : ''

    upsertFilter({
      fieldId,
      operator,
      value: currentValue,
    })
  }

  const handleTextValueChange = (fieldId: string, value: string) => {
    const trimmedValue = value.trim()

    if (!trimmedValue) {
      removeFilter(fieldId)
      return
    }

    const currentFilter = getFilterByField(localFilters, fieldId)

    upsertFilter({
      fieldId,
      operator:
        currentFilter && TEXT_OPERATORS.includes(currentFilter.operator)
          ? currentFilter.operator
          : 'contains',
      value,
    })
  }

  const handleSelectChange = (fieldId: string, value: string) => {
    if (value === 'all') {
      removeFilter(fieldId)
      return
    }

    upsertFilter({
      fieldId,
      operator: 'equals',
      value,
    })
  }

  const handleBooleanChange = (fieldId: string, value: string) => {
    if (value === 'all') {
      removeFilter(fieldId)
      return
    }

    upsertFilter({
      fieldId,
      operator: 'equals',
      value: value === 'true',
    })
  }

  const handleDateOperatorChange = (
    fieldId: string,
    operator: DynamicFilterOperator
  ) => {
    const currentFilter = getFilterByField(localFilters, fieldId)
    const currentValue =
      currentFilter && typeof currentFilter.value === 'string'
        ? currentFilter.value
        : ''

    upsertFilter({
      fieldId,
      operator,
      value: currentValue,
    })
  }

  const handleDateValueChange = (fieldId: string, value: string) => {
    if (!value) {
      removeFilter(fieldId)
      return
    }

    const currentFilter = getFilterByField(localFilters, fieldId)

    upsertFilter({
      fieldId,
      operator:
        currentFilter && DATE_OPERATORS.includes(currentFilter.operator)
          ? currentFilter.operator
          : 'equals',
      value,
    })
  }

  const handleApply = () => {
    onApply(sanitizeFilters(localFilters))
  }

  const handleClear = () => {
    setLocalFilters([])
    onClear()
  }

  return (
    <Sheet open={open} onOpenChange={handleOpenChange}>
      <SheetContent
        side="right"
        className="border-border/60 w-full sm:max-w-md"
      >
        <SheetHeader>
          <SheetTitle className="text-display flex items-center gap-2">
            <SlidersHorizontal className="text-primary h-4 w-4" />
            Filtros do formulário
          </SheetTitle>
          <SheetDescription>
            Os filtros abaixo são combinados entre si para refinar a lista.
          </SheetDescription>
        </SheetHeader>

        <div className="space-y-4 overflow-y-auto py-6">
          {filterableFields.length === 0 ? (
            <div className="border-border/60 bg-muted/30 rounded-xl border p-4 text-sm">
              <p className="text-foreground font-medium">
                Não há campos dinâmicos filtráveis para este gato.
              </p>
              <p className="text-muted-foreground mt-1 text-xs">
                Campos de mídia e texto longo não entram nos filtros avançados.
              </p>
            </div>
          ) : (
            filterableFields.map((field) => {
              const currentFilter = filtersByField.get(field.id)

              return (
                <div
                  key={field.id}
                  className="border-border/60 bg-card/80 space-y-3 rounded-xl border p-3"
                >
                  <Label className="text-sm font-semibold">{field.label}</Label>

                  {field.type === 'text' && (
                    <div className="grid gap-2 sm:grid-cols-[130px_1fr]">
                      <Select
                        value={
                          currentFilter &&
                          TEXT_OPERATORS.includes(currentFilter.operator)
                            ? currentFilter.operator
                            : 'contains'
                        }
                        onValueChange={(value) =>
                          handleTextOperatorChange(
                            field.id,
                            value as DynamicFilterOperator
                          )
                        }
                      >
                        <SelectTrigger className="h-10 rounded-xl">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="contains">Contém</SelectItem>
                          <SelectItem value="equals">É igual a</SelectItem>
                        </SelectContent>
                      </Select>
                      <Input
                        value={
                          currentFilter &&
                          typeof currentFilter.value === 'string'
                            ? currentFilter.value
                            : ''
                        }
                        onChange={(event) =>
                          handleTextValueChange(field.id, event.target.value)
                        }
                        placeholder="Digite um valor"
                        className="h-10 rounded-xl"
                      />
                    </div>
                  )}

                  {field.type === 'select' && (
                    <Select
                      value={
                        currentFilter && typeof currentFilter.value === 'string'
                          ? currentFilter.value
                          : 'all'
                      }
                      onValueChange={(value) =>
                        handleSelectChange(field.id, value)
                      }
                    >
                      <SelectTrigger className="h-10 rounded-xl">
                        <SelectValue placeholder="Qualquer" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">Qualquer</SelectItem>
                        {(field.options ?? []).map((option) => (
                          <SelectItem key={option} value={option}>
                            {option}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}

                  {field.type === 'boolean' && (
                    <Select
                      value={
                        currentFilter &&
                        typeof currentFilter.value === 'boolean'
                          ? String(currentFilter.value)
                          : 'all'
                      }
                      onValueChange={(value) =>
                        handleBooleanChange(field.id, value)
                      }
                    >
                      <SelectTrigger className="h-10 rounded-xl">
                        <SelectValue placeholder="Qualquer" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">Qualquer</SelectItem>
                        <SelectItem value="true">Sim</SelectItem>
                        <SelectItem value="false">Não</SelectItem>
                      </SelectContent>
                    </Select>
                  )}

                  {field.type === 'date' && (
                    <div className="grid gap-2 sm:grid-cols-[130px_1fr]">
                      <Select
                        value={
                          currentFilter &&
                          DATE_OPERATORS.includes(currentFilter.operator)
                            ? currentFilter.operator
                            : 'equals'
                        }
                        onValueChange={(value) =>
                          handleDateOperatorChange(
                            field.id,
                            value as DynamicFilterOperator
                          )
                        }
                      >
                        <SelectTrigger className="h-10 rounded-xl">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="equals">É no dia</SelectItem>
                          <SelectItem value="before">Até</SelectItem>
                          <SelectItem value="after">A partir de</SelectItem>
                        </SelectContent>
                      </Select>
                      <Input
                        type="date"
                        value={
                          currentFilter &&
                          typeof currentFilter.value === 'string'
                            ? currentFilter.value
                            : ''
                        }
                        onChange={(event) =>
                          handleDateValueChange(field.id, event.target.value)
                        }
                        className="h-10 rounded-xl"
                      />
                    </div>
                  )}
                </div>
              )
            })
          )}
        </div>

        <SheetFooter className="flex-row gap-2">
          <Button
            type="button"
            variant="outline"
            onClick={handleClear}
            className="flex-1 gap-2 rounded-xl"
          >
            <FilterX className="h-4 w-4" />
            Limpar
          </Button>
          <Button
            type="button"
            onClick={handleApply}
            className="shadow-primary-glow flex-1 gap-2 rounded-xl"
          >
            <Check className="h-4 w-4" />
            Aplicar
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  )
}
