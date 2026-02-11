'use client'

import {
  Cat as CatIcon,
  Clock3,
  Check,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Image as ImageIcon,
  ShieldCheck,
  Users,
  X,
} from 'lucide-react'
import { useCallback, useMemo, useState } from 'react'

import { CatActionsMenu } from './cat-actions-menu'

import type { ColumnDef, Row } from '@tanstack/react-table'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { DataTable } from '@/components/ui/data-table'
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet'
import { cn } from '@/lib/utils'

interface CatPhoto {
  id: string
  url: string
  order: number
}

// Types
interface Cat {
  id: string
  formId: string | null
  formName: string | null
  name: string
  ageYears: number | null
  ageMonths: number | null
  sex: 'male' | 'female'
  fiv: 'positive' | 'negative' | 'not_tested'
  felv: 'positive' | 'negative' | 'not_tested'
  castrated: boolean
  vaccinated: boolean
  dewormed: boolean
  description: string | null
  status: 'available' | 'in_progress' | 'adopted'
  photoUrl: string | null
  photos?: CatPhoto[]
  interestedCount?: number
}

interface CatsDataTableProps {
  cats: Cat[]
}

// Helper: Format age compact
function formatAge(years: number | null, months: number | null): string {
  if (years && years > 0) {
    if (months && months > 0) {
      return `${years}a ${months}m`
    }
    return `${years}a`
  }
  if (months && months > 0) {
    return `${months}m`
  }
  return '-'
}

// Helper: Status badge config
function getStatusConfig(status: Cat['status']) {
  const config = {
    available: { label: 'Disponível', variant: 'success' as const },
    in_progress: { label: 'Em processo', variant: 'warning' as const },
    adopted: { label: 'Adotado', variant: 'info' as const },
  }
  return config[status]
}

function resolveCatPhotos(cat: Cat): CatPhoto[] {
  if (cat.photos && cat.photos.length > 0) {
    return cat.photos
  }

  if (cat.photoUrl) {
    return [{ id: `${cat.id}-main`, url: cat.photoUrl, order: 1 }]
  }

  return []
}

// Helper: Health badge
function HealthBadge({
  label,
  value,
}: {
  label: string
  value: 'positive' | 'negative' | 'not_tested'
}) {
  const isPositive = value === 'positive'
  const isNegative = value === 'negative'

  const variant = isPositive
    ? ('destructive' as const)
    : isNegative
      ? ('success' as const)
      : ('secondary' as const)

  const symbol = isNegative ? '-' : isPositive ? '+' : '?'

  return (
    <Badge variant={variant} className="rounded-md px-1.5 py-0 text-[10px]">
      {label}
      {symbol}
    </Badge>
  )
}

// Expanded row content
function ExpandedContent({ cat }: { cat: Cat }) {
  return (
    <div className="border-border/50 bg-sidebar-accent/40 animate-in fade-in-0 slide-in-from-top-1 border-t px-3 py-2.5 duration-200">
      <div className="grid gap-3 text-xs sm:grid-cols-2 lg:grid-cols-4">
        {/* Health Info */}
        <div className="space-y-1">
          <p className="text-muted-foreground font-medium uppercase tracking-wide">
            Saúde
          </p>
          <div className="flex flex-wrap gap-1">
            <HealthBadge label="FIV" value={cat.fiv} />
            <HealthBadge label="FeLV" value={cat.felv} />
          </div>
        </div>

        {/* Cuidados */}
        <div className="space-y-1">
          <p className="text-muted-foreground font-medium uppercase tracking-wide">
            Cuidados
          </p>
          <div className="flex flex-wrap gap-2">
            <span
              className={cn(
                'inline-flex items-center gap-0.5',
                cat.castrated ? 'text-success' : 'text-muted-foreground'
              )}
            >
              {cat.castrated ? (
                <Check className="h-3 w-3" />
              ) : (
                <X className="h-3 w-3" />
              )}
              Castrado
            </span>
            <span
              className={cn(
                'inline-flex items-center gap-0.5',
                cat.vaccinated ? 'text-success' : 'text-muted-foreground'
              )}
            >
              {cat.vaccinated ? (
                <Check className="h-3 w-3" />
              ) : (
                <X className="h-3 w-3" />
              )}
              Vacinado
            </span>
            <span
              className={cn(
                'inline-flex items-center gap-0.5',
                cat.dewormed ? 'text-success' : 'text-muted-foreground'
              )}
            >
              {cat.dewormed ? (
                <Check className="h-3 w-3" />
              ) : (
                <X className="h-3 w-3" />
              )}
              Vermifugado
            </span>
          </div>
        </div>

        <div className="space-y-1">
          <p className="text-muted-foreground font-medium uppercase tracking-wide">
            Formulário
          </p>
          <p className="text-foreground/80 leading-relaxed">
            {cat.formName ?? 'Sem formulário selecionado'}
          </p>
        </div>

        {/* Description */}
        {cat.description && (
          <div className="space-y-1 sm:col-span-2">
            <p className="text-muted-foreground font-medium uppercase tracking-wide">
              Descrição
            </p>
            <p className="text-foreground/80 leading-relaxed">
              {cat.description}
            </p>
          </div>
        )}
      </div>
    </div>
  )
}

function getColumns(
  onOpenPhotoPreview: (cat: Cat) => void
): ColumnDef<Cat>[] {
  return [
    // Expand column
    {
      id: 'expand',
      header: () => null,
      cell: ({ row }) => (
        <Button
          variant="ghost"
          size="icon"
          className="h-6 w-6 rounded-md"
          onClick={() => row.toggleExpanded()}
          aria-label={row.getIsExpanded() ? 'Recolher' : 'Expandir'}
        >
          {row.getIsExpanded() ? (
            <ChevronDown className="h-3.5 w-3.5" />
          ) : (
            <ChevronRight className="h-3.5 w-3.5" />
          )}
        </Button>
      ),
      meta: { className: 'w-8 px-1' },
    },
    // Photo + Name
    {
      id: 'cat',
      accessorKey: 'name',
      header: () => (
        <span className="inline-flex items-center gap-1.5">
          <CatIcon className="text-primary h-3.5 w-3.5" />
          Gato
        </span>
      ),
      cell: ({ row }) => {
        const cat = row.original
        const photoCount = resolveCatPhotos(cat).length

        return (
          <div className="flex items-center gap-2.5">
            <div className="bg-muted relative h-12 w-12 shrink-0 overflow-hidden rounded-lg border border-border/50">
              {cat.photoUrl ? (
                <button
                  type="button"
                  onClick={() => onOpenPhotoPreview(cat)}
                  className="group/photo relative h-full w-full"
                  aria-label={`Ver fotos de ${cat.name}`}
                >
                  <img
                    src={cat.photoUrl}
                    alt={cat.name}
                    className="h-full w-full object-cover transition-transform duration-200 group-hover/photo:scale-105"
                    loading="lazy"
                  />
                  <span className="from-foreground/55 absolute inset-x-0 bottom-0 h-5 bg-gradient-to-t to-transparent" />
                  <span className="text-card absolute right-1 bottom-0.5 text-[10px] font-semibold">
                    {photoCount > 1 ? `${photoCount} fotos` : '1 foto'}
                  </span>
                </button>
              ) : (
                <div className="flex h-full w-full items-center justify-center">
                  <CatIcon className="text-muted-foreground h-4 w-4" />
                </div>
              )}
            </div>
            <div className="min-w-0">
              <p className="text-foreground truncate text-sm font-medium">
                {cat.name}
              </p>
              <p className="text-muted-foreground truncate text-[11px] sm:hidden">
                {formatAge(cat.ageYears, cat.ageMonths)} •{' '}
                {cat.sex === 'male' ? 'M' : 'F'}
              </p>
            </div>
          </div>
        )
      },
      meta: { className: 'min-w-[120px]' },
    },
    // Age (hidden on mobile)
    {
      id: 'age',
      accessorFn: (row) => (row.ageYears ?? 0) * 12 + (row.ageMonths ?? 0),
      header: () => (
        <span className="hidden items-center gap-1 sm:inline-flex">
          <Clock3 className="h-3.5 w-3.5" />
          Idade
        </span>
      ),
      cell: ({ row }) => (
        <span className="text-muted-foreground hidden text-sm sm:inline">
          {formatAge(row.original.ageYears, row.original.ageMonths)}
        </span>
      ),
      meta: { className: 'hidden sm:table-cell w-16' },
    },
    // Sex (hidden on mobile)
    {
      id: 'sex',
      accessorKey: 'sex',
      header: () => <span className="hidden md:inline">Sexo</span>,
      cell: ({ row }) => (
        <span className="text-muted-foreground hidden text-sm md:inline">
          {row.original.sex === 'male' ? 'Macho' : 'Fêmea'}
        </span>
      ),
      meta: { className: 'hidden md:table-cell w-16' },
    },
    // Interested count
    {
      id: 'interested',
      accessorKey: 'interestedCount',
      header: () => (
        <span className="hidden lg:inline" title="Interessados">
          <Users className="h-4 w-4" />
        </span>
      ),
      cell: ({ row }) => {
        const count = row.original.interestedCount ?? 0
        return (
          <span
            className={cn(
              'hidden text-sm lg:inline',
              count > 0 ? 'text-primary font-medium' : 'text-muted-foreground'
            )}
          >
            {count}
          </span>
        )
      },
      meta: { className: 'hidden lg:table-cell w-12 text-center' },
    },
    // Status
    {
      id: 'status',
      accessorKey: 'status',
      header: () => (
        <span className="hidden items-center gap-1 sm:inline-flex">
          <ShieldCheck className="h-3.5 w-3.5" />
          Status
        </span>
      ),
      cell: ({ row }) => {
        const config = getStatusConfig(row.original.status)
        return (
          <Badge
            variant={config.variant}
            className="hidden whitespace-nowrap px-1.5 py-0 text-[10px] sm:inline-flex"
          >
            {config.label}
          </Badge>
        )
      },
      meta: { className: 'hidden sm:table-cell' },
    },
    // Actions - always visible, sticky on mobile
    {
      id: 'actions',
      header: () => null,
      cell: ({ row }) => <CatActionsMenu cat={row.original} />,
      meta: {
        className:
          'w-10 px-1 sticky right-0 bg-card/95 group-hover:bg-sidebar-accent/20',
        headerClassName: 'sticky right-0 bg-muted/50',
      },
    },
  ]
}

export function CatsDataTable({ cats }: CatsDataTableProps) {
  const [previewState, setPreviewState] = useState<{
    cat: Cat
    index: number
  } | null>(null)

  const openPhotoPreview = useCallback((cat: Cat) => {
    const photos = resolveCatPhotos(cat)
    if (photos.length === 0) return
    setPreviewState({ cat, index: 0 })
  }, [])

  const closePhotoPreview = useCallback((open: boolean) => {
    if (!open) {
      setPreviewState(null)
    }
  }, [])

  const previewPhotos = useMemo(
    () => (previewState ? resolveCatPhotos(previewState.cat) : []),
    [previewState]
  )

  const activePhoto =
    previewState && previewPhotos.length > 0
      ? previewPhotos[previewState.index]
      : null

  const hasCarousel = previewPhotos.length > 1

  const goToPreviousPhoto = useCallback(() => {
    setPreviewState((current) => {
      if (!current) return current

      const photos = resolveCatPhotos(current.cat)
      if (photos.length <= 1) return current

      return {
        ...current,
        index: current.index === 0 ? photos.length - 1 : current.index - 1,
      }
    })
  }, [])

  const goToNextPhoto = useCallback(() => {
    setPreviewState((current) => {
      if (!current) return current

      const photos = resolveCatPhotos(current.cat)
      if (photos.length <= 1) return current

      return {
        ...current,
        index: current.index >= photos.length - 1 ? 0 : current.index + 1,
      }
    })
  }, [])

  const goToPhotoIndex = useCallback((index: number) => {
    setPreviewState((current) => {
      if (!current) return current

      const photos = resolveCatPhotos(current.cat)
      if (index < 0 || index >= photos.length) return current

      return {
        ...current,
        index,
      }
    })
  }, [])

  const columns = useMemo(() => getColumns(openPhotoPreview), [openPhotoPreview])

  return (
    <>
      <DataTable
        columns={columns}
        data={cats}
        className="border-border/60 bg-card/95 shadow-warm-sm rounded-xl border"
        renderExpandedRow={(row: Row<Cat>) => (
          <ExpandedContent cat={row.original} />
        )}
      />

      <Sheet open={Boolean(previewState)} onOpenChange={closePhotoPreview}>
        <SheetContent
          side="right"
          className="w-full overflow-y-auto p-0 sm:max-w-lg"
        >
          {previewState ? (
            <div className="flex h-full flex-col">
              <SheetHeader className="border-border/60 border-b px-5 py-4 pr-12">
                <SheetTitle className="text-display text-xl">
                  {previewState.cat.name}
                </SheetTitle>
                <SheetDescription>
                  {activePhoto
                    ? `Foto ${previewState.index + 1} de ${previewPhotos.length}`
                    : 'Sem foto disponível'}
                </SheetDescription>
              </SheetHeader>

              <div className="flex flex-1 flex-col gap-3 p-4">
                <div className="border-border/60 bg-muted/40 relative overflow-hidden rounded-xl border">
                  <div className="aspect-[4/3] w-full">
                    {activePhoto ? (
                      <img
                        src={activePhoto.url}
                        alt={`Foto ${previewState.index + 1} de ${previewState.cat.name}`}
                        className="h-full w-full object-contain"
                      />
                    ) : (
                      <div className="text-muted-foreground flex h-full w-full items-center justify-center gap-2 text-sm">
                        <ImageIcon className="h-4 w-4" />
                        Sem foto
                      </div>
                    )}
                  </div>

                  {hasCarousel && (
                    <>
                      <Button
                        type="button"
                        variant="secondary"
                        size="icon"
                        onClick={goToPreviousPhoto}
                        className="absolute top-1/2 left-2 h-8 w-8 -translate-y-1/2 rounded-full"
                        aria-label="Foto anterior"
                      >
                        <ChevronLeft className="h-4 w-4" />
                      </Button>
                      <Button
                        type="button"
                        variant="secondary"
                        size="icon"
                        onClick={goToNextPhoto}
                        className="absolute top-1/2 right-2 h-8 w-8 -translate-y-1/2 rounded-full"
                        aria-label="Próxima foto"
                      >
                        <ChevronRight className="h-4 w-4" />
                      </Button>
                    </>
                  )}
                </div>

                {hasCarousel && (
                  <div className="flex gap-2 overflow-x-auto pb-1">
                    {previewPhotos.map((photo, index) => {
                      const isActive = index === previewState.index
                      return (
                        <button
                          key={photo.id}
                          type="button"
                          onClick={() => goToPhotoIndex(index)}
                          className={cn(
                            'relative h-14 w-14 shrink-0 overflow-hidden rounded-lg border transition-colors',
                            isActive
                              ? 'border-primary ring-primary/30 ring-2'
                              : 'border-border/60 hover:border-primary/50'
                          )}
                          aria-label={`Abrir foto ${index + 1}`}
                        >
                          <img
                            src={photo.url}
                            alt={`Miniatura ${index + 1} de ${previewState.cat.name}`}
                            className="h-full w-full object-cover"
                          />
                        </button>
                      )
                    })}
                  </div>
                )}
              </div>
            </div>
          ) : null}
        </SheetContent>
      </Sheet>
    </>
  )
}
