'use client'

import { keepPreviousData, useQuery } from '@tanstack/react-query'
import { AlertTriangle, Loader2, PawPrint } from 'lucide-react'
import { useRouter, useSearchParams } from 'next/navigation'
import { useCallback, useMemo, useTransition } from 'react'
import { toast } from 'sonner'

import {
  PublicCatCard,
  type PublicCatCardData,
} from './public-cat-card'
import { PublicCatsPagination } from './public-cats-pagination'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { useOrgSlug } from '@/hooks/use-org-slug'
import { trpc } from '@/utils/trpc'

type AgeRange = 'kitten' | 'young' | 'adult' | 'senior'
type SexFilter = 'male' | 'female'

interface PublicCatsFilters {
  sex?: SexFilter
  ageRange?: AgeRange
  page: number
}

const AGE_OPTIONS: Array<{ value: AgeRange; label: string }> = [
  { value: 'kitten', label: 'Filhote (0-11 meses)' },
  { value: 'young', label: 'Jovem (1-3 anos)' },
  { value: 'adult', label: 'Adulto (4-7 anos)' },
  { value: 'senior', label: 'Sênior (8+ anos)' },
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
    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
      {Array.from({ length: 9 }).map((_, index) => (
        <Card
          key={`public-cat-skeleton-${index}`}
          className="bg-card/95 shadow-warm-md rounded-2xl border-border/60 overflow-hidden"
        >
          <div className="bg-muted h-52 animate-pulse" />
          <CardContent className="space-y-3 p-5">
            <div className="bg-muted h-6 w-2/3 animate-pulse rounded" />
            <div className="bg-muted h-4 w-1/2 animate-pulse rounded" />
            <div className="grid gap-2 sm:grid-cols-2">
              <div className="bg-muted h-12 animate-pulse rounded-xl" />
              <div className="bg-muted h-12 animate-pulse rounded-xl" />
              <div className="bg-muted h-12 animate-pulse rounded-xl" />
              <div className="bg-muted h-12 animate-pulse rounded-xl" />
            </div>
            <div className="bg-muted h-14 animate-pulse rounded-xl" />
            <div className="bg-muted h-10 animate-pulse rounded-xl" />
          </CardContent>
        </Card>
      ))}
    </div>
  )
}

function EmptyState({ onClearFilters }: { onClearFilters: () => void }) {
  return (
    <Card className="bg-card/95 shadow-warm-lg rounded-2xl border-border/60">
      <CardContent className="flex flex-col items-center gap-3 py-12 text-center">
        <div className="bg-muted/40 text-primary flex h-14 w-14 items-center justify-center rounded-full">
          <PawPrint className="h-6 w-6" />
        </div>
        <div className="space-y-1">
          <h3 className="text-display text-xl font-semibold">
            Nenhum gatinho encontrado
          </h3>
          <p className="text-muted-foreground max-w-md text-sm">
            Não encontramos gatinhos com os filtros escolhidos. Tente limpar os
            filtros para ver todos os disponíveis.
          </p>
        </div>
        <Button variant="outline" className="rounded-xl" onClick={onClearFilters}>
          Limpar filtros
        </Button>
      </CardContent>
    </Card>
  )
}

export function PublicCatsSection() {
  const slug = useOrgSlug()
  const router = useRouter()
  const searchParams = useSearchParams()
  const [isPending, startTransition] = useTransition()

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
    toast.info(`A candidatura para ${cat.name} será aberta na próxima etapa.`)
  }, [])

  const hasActiveFilters = Boolean(filters.sex || filters.ageRange)
  const totalLabel =
    data && data.pagination.total === 1
      ? '1 gatinho disponível'
      : `${data?.pagination.total ?? 0} gatinhos disponíveis`

  return (
    <section
      id="gatos-disponiveis"
      className="px-4 pt-2 pb-16 sm:px-6 lg:px-8 lg:pb-20"
    >
      <div className="mx-auto w-full max-w-6xl space-y-5">
        <div className="space-y-2">
          <Badge className="rounded-full bg-primary/15 px-3 py-1 text-xs font-semibold text-primary hover:bg-primary/15">
            Vitrine de adoção
          </Badge>
          <h2 className="text-display text-3xl font-bold tracking-tight sm:text-4xl">
            Gatinhos esperando um novo lar
          </h2>
          <p className="text-muted-foreground max-w-2xl text-base text-balance">
            Veja os perfis completos e escolha o gatinho que combina com sua
            rotina e com o seu espaço.
          </p>
        </div>

        <Card className="bg-card/95 shadow-warm-md rounded-2xl border border-border/60">
          <CardContent className="grid gap-3 p-4 sm:grid-cols-2 lg:grid-cols-[1fr_1fr_auto] lg:items-end">
            <div className="space-y-1">
              <p className="text-muted-foreground text-xs font-semibold uppercase">
                Sexo
              </p>
              <Select
                value={filters.sex ?? 'all'}
                onValueChange={(value) =>
                  updateFilters({
                    sex: value === 'all' ? undefined : (value as SexFilter),
                  })
                }
                disabled={isPending}
              >
                <SelectTrigger className="h-11 rounded-xl">
                  <SelectValue placeholder="Todos" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos</SelectItem>
                  <SelectItem value="male">Macho</SelectItem>
                  <SelectItem value="female">Fêmea</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1">
              <p className="text-muted-foreground text-xs font-semibold uppercase">
                Faixa etária
              </p>
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
                <SelectTrigger className="h-11 rounded-xl">
                  <SelectValue placeholder="Todas as idades" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas as idades</SelectItem>
                  {AGE_OPTIONS.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <Button
              variant="outline"
              className="h-11 rounded-xl"
              onClick={clearFilters}
              disabled={!hasActiveFilters || isPending}
            >
              Limpar filtros
            </Button>
          </CardContent>
        </Card>

        {isLoading && !data ? (
          <LoadingGrid />
        ) : isError ? (
          <Card className="border-destructive/25 bg-destructive/5 shadow-warm-sm rounded-2xl border">
            <CardContent className="py-6">
              <p className="text-destructive flex items-center justify-center gap-2 text-sm">
                <AlertTriangle className="h-4 w-4" />
                Erro ao carregar os gatinhos disponíveis.
              </p>
              <div className="mt-3 flex justify-center">
                <Button
                  variant="outline"
                  className="rounded-xl"
                  onClick={() => refetch()}
                >
                  Tentar novamente
                </Button>
              </div>
            </CardContent>
          </Card>
        ) : !data?.cats.length ? (
          <EmptyState onClearFilters={clearFilters} />
        ) : (
          <>
            <div className="border-border/60 bg-card/95 shadow-warm-sm flex items-center justify-between rounded-2xl border px-4 py-3">
              <p className="text-muted-foreground inline-flex items-center gap-2 text-sm font-medium">
                <PawPrint className="text-primary h-4 w-4" />
                {totalLabel}
              </p>
              {isFetching && (
                <span className="text-muted-foreground inline-flex items-center gap-1.5 text-xs">
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  Atualizando...
                </span>
              )}
            </div>

            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              {data.cats.map((cat) => (
                <PublicCatCard
                  key={cat.id}
                  cat={cat}
                  onAdoptClick={handleAdoptClick}
                />
              ))}
            </div>

            <PublicCatsPagination
              page={data.pagination.page}
              totalPages={data.pagination.totalPages}
              onPageChange={(newPage) => updateFilters({ page: newPage }, false)}
            />
          </>
        )}
      </div>
    </section>
  )
}
