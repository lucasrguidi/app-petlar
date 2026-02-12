'use client'

import { keepPreviousData, useQuery } from '@tanstack/react-query'
import { AlertTriangle, Loader2, PawPrint, Sparkles, X } from 'lucide-react'
import { useRouter, useSearchParams } from 'next/navigation'
import { useCallback, useMemo, useState, useTransition } from 'react'

import { ApplicationSheet } from './application-sheet'
import {
  PublicCatCard,
  type PublicCatCardData,
} from './public-cat-card'
import { PublicCatsPagination } from './public-cats-pagination'

import { Button } from '@/components/ui/button'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { useOrgSlug } from '@/hooks/use-org-slug'
import { cn } from '@/lib/utils'
import { trpc } from '@/utils/trpc'

type AgeRange = 'kitten' | 'young' | 'adult' | 'senior'
type SexFilter = 'male' | 'female'

interface PublicCatsFilters {
  sex?: SexFilter
  ageRange?: AgeRange
  page: number
}

const AGE_OPTIONS: Array<{ value: AgeRange; label: string; emoji: string }> = [
  { value: 'kitten', label: 'Filhote (0-11m)', emoji: '🐱' },
  { value: 'young', label: 'Jovem (1-3 anos)', emoji: '😺' },
  { value: 'adult', label: 'Adulto (4-7 anos)', emoji: '🐈' },
  { value: 'senior', label: 'Sênior (8+ anos)', emoji: '😻' },
]

const SEX_OPTIONS: Array<{ value: SexFilter; label: string; emoji: string }> = [
  { value: 'male', label: 'Macho', emoji: '♂️' },
  { value: 'female', label: 'Fêmea', emoji: '♀️' },
]

function parsePage(pageParam: string | null): number {
  const parsed = Number(pageParam ?? '1')
  return Number.isFinite(parsed) && parsed >= 1 ? Math.floor(parsed) : 1
}

function parseSexFilter(value: string | null): SexFilter | undefined {
  return value === 'male' || value === 'female' ? value : undefined
}

function parseAgeRange(value: string | null): AgeRange | undefined {
  return AGE_OPTIONS.some((option) => option.value === value)
    ? (value as AgeRange)
    : undefined
}

function LoadingGrid() {
  return (
    <div className="grid gap-6 sm:grid-cols-2 xl:grid-cols-3">
      {Array.from({ length: 6 }).map((_, index) => (
        <div
          key={`skeleton-${index}`}
          className="overflow-hidden rounded-3xl bg-white/80 shadow-lg backdrop-blur-sm"
          style={{ animationDelay: `${index * 100}ms` }}
        >
          <div className="h-56 animate-pulse bg-gradient-to-br from-[#AEC7E2]/40 to-white" />
          <div className="space-y-3 p-5">
            <div className="h-6 w-2/3 animate-pulse rounded-lg bg-[#AEC7E2]/30" />
            <div className="h-4 w-1/2 animate-pulse rounded-lg bg-[#AEC7E2]/20" />
            <div className="grid grid-cols-2 gap-2">
              <div className="h-10 animate-pulse rounded-xl bg-[#AEC7E2]/20" />
              <div className="h-10 animate-pulse rounded-xl bg-[#AEC7E2]/20" />
            </div>
            <div className="h-12 animate-pulse rounded-xl bg-[#E35915]/10" />
          </div>
        </div>
      ))}
    </div>
  )
}

function EmptyState({ onClearFilters }: { onClearFilters: () => void }) {
  return (
    <div className="rounded-3xl bg-white/80 py-16 text-center shadow-lg backdrop-blur-sm">
      <div className="mx-auto mb-6 flex h-24 w-24 items-center justify-center rounded-full bg-gradient-to-br from-[#AEC7E2]/50 to-[#E35915]/20">
        <PawPrint className="h-10 w-10 text-[#E35915]" />
      </div>
      <h3
        className="mb-2 text-2xl font-bold text-[#783201]"
        style={{ fontFamily: 'var(--font-display)' }}
      >
        Nenhum gatinho encontrado
      </h3>
      <p className="mx-auto mb-6 max-w-md text-[#783201]/80">
        Não encontramos gatinhos com os filtros escolhidos. Que tal limpar os
        filtros para ver todos os disponíveis?
      </p>
      <Button
        onClick={onClearFilters}
        className={cn(
          'rounded-xl px-6',
          'bg-gradient-to-r from-[#E35915] to-[#F07B3D]',
          'shadow-lg shadow-[#E35915]/25'
        )}
      >
        <Sparkles className="mr-2 h-4 w-4" />
        Ver todos os gatinhos
      </Button>
    </div>
  )
}

export function PublicCatsSection() {
  const slug = useOrgSlug()
  const router = useRouter()
  const searchParams = useSearchParams()
  const [isPending, startTransition] = useTransition()
  const [selectedCat, setSelectedCat] = useState<PublicCatCardData | null>(null)
  const [isApplicationSheetOpen, setIsApplicationSheetOpen] = useState(false)

  const filters = useMemo<PublicCatsFilters>(
    () => ({
      sex: parseSexFilter(searchParams.get('sex')),
      ageRange: parseAgeRange(searchParams.get('ageRange')),
      page: parsePage(searchParams.get('page')),
    }),
    [searchParams]
  )

  const { data, isLoading, isFetching, isError, refetch } = useQuery({
    ...trpc.cats.listPublic.queryOptions({
      slug,
      sex: filters.sex,
      ageRange: filters.ageRange,
      page: filters.page,
      limit: 9,
    }),
    placeholderData: keepPreviousData,
  })

  const updateFilters = useCallback(
    (newFilters: Partial<PublicCatsFilters>, resetPage = true) => {
      startTransition(() => {
        const params = new URLSearchParams(searchParams.toString())
        const merged = {
          ...filters,
          ...newFilters,
          page: resetPage ? 1 : (newFilters.page ?? filters.page),
        }

        params.delete('sex')
        params.delete('ageRange')
        params.delete('page')

        if (merged.sex) {
          params.set('sex', merged.sex)
        }
        if (merged.ageRange) {
          params.set('ageRange', merged.ageRange)
        }
        if (merged.page > 1) {
          params.set('page', String(merged.page))
        }

        const queryString = params.toString()
        router.push(queryString ? `?${queryString}` : '?', { scroll: false })
      })
    },
    [filters, router, searchParams]
  )

  const clearFilters = useCallback(() => {
    updateFilters({
      sex: undefined,
      ageRange: undefined,
      page: 1,
    })
  }, [updateFilters])

  const handleAdoptClick = useCallback((cat: PublicCatCardData) => {
    setSelectedCat(cat)
    setIsApplicationSheetOpen(true)
  }, [])

  const handleApplicationSheetOpenChange = useCallback((nextOpen: boolean) => {
    setIsApplicationSheetOpen(nextOpen)

    if (!nextOpen) {
      setSelectedCat(null)
    }
  }, [])

  const hasActiveFilters = Boolean(filters.sex || filters.ageRange)
  const totalLabel =
    data && data.pagination.total === 1
      ? '1 gatinho disponível'
      : `${data?.pagination.total ?? 0} gatinhos disponíveis`

  return (
    <section
      id="gatos-disponiveis"
      className="relative px-4 pt-8 pb-20 sm:px-6 lg:px-8 lg:pb-28"
    >
      {/* Background decoration */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute top-0 right-1/4 h-[400px] w-[400px] rounded-full bg-white/30 blur-3xl" />
      </div>

      <div className="relative mx-auto w-full max-w-6xl space-y-8">
        {/* Header */}
        <div className="space-y-4">
          <div className="inline-flex items-center gap-2 rounded-full bg-white/60 px-4 py-2 backdrop-blur-sm">
            <PawPrint className="h-4 w-4 text-[#E35915]" />
            <span className="text-sm font-semibold text-[#783201]">
              Vitrine de adoção
            </span>
          </div>
          <h2
            className="text-3xl font-bold tracking-tight text-[#783201] sm:text-4xl lg:text-5xl"
            style={{ fontFamily: 'var(--font-display)' }}
          >
            Gatinhos esperando um lar
          </h2>
          <p className="max-w-2xl text-lg text-[#783201]/80">
            Cada gatinho tem sua história. Encontre aquele que vai fazer parte
            da sua.
          </p>
        </div>

        {/* Filters */}
        <div
          className={cn(
            'rounded-2xl p-4 sm:p-5',
            'bg-white/70 backdrop-blur-sm',
            'border border-white/50',
            'shadow-lg shadow-[#783201]/5'
          )}
        >
          <div className="flex flex-col gap-4 sm:flex-row sm:items-end">
            <div className="flex flex-1 flex-col gap-4 sm:flex-row">
              {/* Sex filter */}
              <div className="flex-1 space-y-1.5">
                <label className="text-xs font-semibold uppercase tracking-wide text-[#783201]/60">
                  Sexo
                </label>
                <Select
                  value={filters.sex ?? 'all'}
                  onValueChange={(value) =>
                    updateFilters({
                      sex: value === 'all' ? undefined : (value as SexFilter),
                    })
                  }
                  disabled={isPending}
                >
                  <SelectTrigger
                    className={cn(
                      'h-12 rounded-xl border-[#AEC7E2]/50 bg-white/80',
                      'text-[#783201]',
                      'transition-all focus:border-[#E35915]/30 focus:ring-[#E35915]/20'
                    )}
                  >
                    <SelectValue placeholder="Todos" />
                  </SelectTrigger>
                  <SelectContent className="rounded-xl">
                    <SelectItem value="all" className="rounded-lg">
                      Todos
                    </SelectItem>
                    {SEX_OPTIONS.map((option) => (
                      <SelectItem
                        key={option.value}
                        value={option.value}
                        className="rounded-lg"
                      >
                        {option.emoji} {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Age filter */}
              <div className="flex-1 space-y-1.5">
                <label className="text-xs font-semibold uppercase tracking-wide text-[#783201]/60">
                  Faixa etária
                </label>
                <Select
                  value={filters.ageRange ?? 'all'}
                  onValueChange={(value) =>
                    updateFilters({
                      ageRange:
                        value === 'all' ? undefined : (value as AgeRange),
                    })
                  }
                  disabled={isPending}
                >
                  <SelectTrigger
                    className={cn(
                      'h-12 rounded-xl border-[#AEC7E2]/50 bg-white/80',
                      'text-[#783201]',
                      'transition-all focus:border-[#E35915]/30 focus:ring-[#E35915]/20'
                    )}
                  >
                    <SelectValue placeholder="Todas as idades" />
                  </SelectTrigger>
                  <SelectContent className="rounded-xl">
                    <SelectItem value="all" className="rounded-lg">
                      Todas as idades
                    </SelectItem>
                    {AGE_OPTIONS.map((option) => (
                      <SelectItem
                        key={option.value}
                        value={option.value}
                        className="rounded-lg"
                      >
                        {option.emoji} {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Clear filters button */}
            {hasActiveFilters && (
              <Button
                variant="ghost"
                onClick={clearFilters}
                disabled={isPending}
                className="h-12 rounded-xl text-[#783201]/70 hover:bg-[#AEC7E2]/30 hover:text-[#783201]"
              >
                <X className="mr-1.5 h-4 w-4" />
                Limpar filtros
              </Button>
            )}
          </div>

          {/* Active filters chips */}
          {hasActiveFilters && (
            <div className="mt-4 flex flex-wrap gap-2 border-t border-[#AEC7E2]/30 pt-4">
              {filters.sex && (
                <button
                  onClick={() => updateFilters({ sex: undefined })}
                  className="inline-flex items-center gap-1.5 rounded-full bg-[#E35915]/10 px-3 py-1.5 text-sm font-medium text-[#E35915] transition-colors hover:bg-[#E35915]/20"
                >
                  {SEX_OPTIONS.find((o) => o.value === filters.sex)?.emoji}{' '}
                  {SEX_OPTIONS.find((o) => o.value === filters.sex)?.label}
                  <X className="h-3.5 w-3.5" />
                </button>
              )}
              {filters.ageRange && (
                <button
                  onClick={() => updateFilters({ ageRange: undefined })}
                  className="inline-flex items-center gap-1.5 rounded-full bg-[#E35915]/10 px-3 py-1.5 text-sm font-medium text-[#E35915] transition-colors hover:bg-[#E35915]/20"
                >
                  {AGE_OPTIONS.find((o) => o.value === filters.ageRange)?.emoji}{' '}
                  {AGE_OPTIONS.find((o) => o.value === filters.ageRange)?.label}
                  <X className="h-3.5 w-3.5" />
                </button>
              )}
            </div>
          )}
        </div>

        {/* Results */}
        {isLoading && !data ? (
          <LoadingGrid />
        ) : isError ? (
          <div
            className={cn(
              'rounded-2xl p-8 text-center',
              'bg-red-50/80 backdrop-blur-sm',
              'border border-red-200/50'
            )}
          >
            <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-red-100">
              <AlertTriangle className="h-6 w-6 text-red-600" />
            </div>
            <p className="mb-4 text-red-700">
              Erro ao carregar os gatinhos disponíveis.
            </p>
            <Button
              onClick={() => refetch()}
              variant="outline"
              className="rounded-xl border-red-200 text-red-700 hover:bg-red-50"
            >
              Tentar novamente
            </Button>
          </div>
        ) : !data?.cats.length ? (
          <EmptyState onClearFilters={clearFilters} />
        ) : (
          <>
            {/* Results count */}
            <div
              className={cn(
                'flex items-center justify-between rounded-2xl px-5 py-3',
                'bg-white/60 backdrop-blur-sm',
                'border border-white/50'
              )}
            >
              <p className="inline-flex items-center gap-2 text-sm font-medium text-[#783201]">
                <PawPrint className="h-4 w-4 text-[#E35915]" />
                {totalLabel}
              </p>
              {isFetching && (
                <span className="inline-flex items-center gap-1.5 text-xs text-[#783201]/60">
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  Atualizando...
                </span>
              )}
            </div>

            {/* Grid */}
            <div className="grid gap-6 sm:grid-cols-2 xl:grid-cols-3">
              {data.cats.map((cat, index) => (
                <div
                  key={cat.id}
                  className="animate-fade-in"
                  style={{ animationDelay: `${index * 50}ms` }}
                >
                  <PublicCatCard cat={cat} onAdoptClick={handleAdoptClick} />
                </div>
              ))}
            </div>

            {/* Pagination */}
            <PublicCatsPagination
              page={data.pagination.page}
              totalPages={data.pagination.totalPages}
              onPageChange={(newPage) => updateFilters({ page: newPage }, false)}
            />
          </>
        )}
      </div>

      <ApplicationSheet
        open={isApplicationSheetOpen}
        onOpenChange={handleApplicationSheetOpenChange}
        cat={selectedCat}
      />
    </section>
  )
}
