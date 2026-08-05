'use client'

import {
  Cat as CatIcon,
  Check,
  ChevronLeft,
  ChevronRight,
  CircleHelp,
  ExternalLink,
  Image as ImageIcon,
  Mars,
  MessageCircle,
  Pencil,
  Users,
  Venus,
  X,
} from 'lucide-react'
import { type Route } from 'next'
import Link from 'next/link'
import { useCallback, useMemo, useState } from 'react'

import { CatActionsMenu } from './cat-actions-menu'

function formatPhone(value: string): string {
  const digits = value.replace(/\D/g, '').slice(0, 11)
  if (digits.length <= 2) return digits
  if (digits.length <= 7) return `(${digits.slice(0, 2)}) ${digits.slice(2)}`
  return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7)}`
}

import type { ColumnDef, Row } from '@tanstack/react-table'

import { useIsCustomDomain } from '@/components/custom-domain-provider'
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
import { useOrgSlug } from '@/hooks/use-org-slug'
import { buildOrgHref } from '@/lib/org-href'
import { cn } from '@/lib/utils'

interface CatPhoto {
  id: string
  url: string
  order: number
}

interface Cat {
  id: string
  formId: string | null
  formName: string | null
  name: string
  ageYears: number | null
  ageMonths: number | null
  sex: 'male' | 'female' | 'unknown'
  fiv: 'positive' | 'negative' | 'not_tested'
  felv: 'positive' | 'negative' | 'not_tested'
  castrated: boolean
  vaccinated: boolean
  dewormed: boolean
  description: string | null
  donorName?: string | null
  donorWhatsapp?: string | null
  status: 'available' | 'in_progress'
  photoUrl: string | null
  photos?: CatPhoto[]
  interestedCount?: number
  pendingApplicationsCount?: number
  groupId?: string | null
  groupDescription?: string | null
}

interface DisplayRow extends Cat {
  isGroupRow?: boolean
  groupCats?: Cat[]
}

interface CatsDataTableProps {
  cats: Cat[]
}

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

function getStatusConfig(status: Cat['status']) {
  const config = {
    available: {
      label: 'Disponível',
      variant: 'success' as const,
      dotClass: 'bg-success',
    },
    in_progress: {
      label: 'Em processo',
      variant: 'warning' as const,
      dotClass: 'bg-warning',
    },
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

function formatGroupNames(cats: Cat[]): string {
  if (cats.length <= 2) return cats.map((c) => c.name).join(' & ')
  const names = cats.map((c) => c.name)
  return `${names.slice(0, -1).join(', ')} & ${names[names.length - 1]}`
}

function buildDisplayRows(cats: Cat[]): DisplayRow[] {
  const groups = new Map<string, Cat[]>()
  const result: DisplayRow[] = []
  const processedGroups = new Set<string>()

  for (const cat of cats) {
    if (cat.groupId) {
      const existing = groups.get(cat.groupId)
      if (existing) {
        existing.push(cat)
      } else {
        groups.set(cat.groupId, [cat])
      }
    }
  }

  for (const cat of cats) {
    if (cat.groupId) {
      if (!processedGroups.has(cat.groupId)) {
        processedGroups.add(cat.groupId)
        const groupCats = groups.get(cat.groupId)!
        if (groupCats.length >= 2) {
          result.push({
            ...groupCats[0]!,
            isGroupRow: true,
            groupCats,
          })
        } else {
          result.push(cat)
        }
      }
    } else {
      result.push(cat)
    }
  }

  return result
}

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
    <Badge
      variant={variant}
      className="rounded-md px-1.5 py-0.5 text-[10px] font-medium"
    >
      {label}
      {symbol}
    </Badge>
  )
}

function ColumnHeader({
  icon: Icon,
  label,
  className,
}: {
  icon?: React.ElementType
  label: string
  className?: string
}) {
  return (
    <span
      className={cn(
        'text-muted-foreground inline-flex items-center gap-1.5 text-xs font-medium',
        className
      )}
    >
      {Icon && <Icon className="h-3.5 w-3.5 opacity-70" />}
      {label}
    </span>
  )
}

function CareIndicator({ label, active }: { label: string; active: boolean }) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-xs transition-colors',
        active
          ? 'bg-success/10 text-success'
          : 'bg-muted/60 text-muted-foreground'
      )}
    >
      {active ? (
        <Check className="h-3 w-3" strokeWidth={2.5} />
      ) : (
        <X className="h-3 w-3" />
      )}
      {label}
    </span>
  )
}

function ExpandedContent({ cat }: { cat: Cat }) {
  return (
    <div className="border-border/40 from-muted/30 to-muted/10 animate-in fade-in-0 slide-in-from-top-1 border-t bg-gradient-to-b px-4 py-3 duration-200">
      <div className="grid gap-4 text-xs sm:grid-cols-2 lg:grid-cols-4">
        <div className="space-y-2">
          <p className="text-muted-foreground/80 text-[10px] font-semibold tracking-wider uppercase">
            Saúde
          </p>
          <div className="flex flex-wrap gap-1.5">
            <HealthBadge label="FIV" value={cat.fiv} />
            <HealthBadge label="FeLV" value={cat.felv} />
          </div>
        </div>

        <div className="space-y-2">
          <p className="text-muted-foreground/80 text-[10px] font-semibold tracking-wider uppercase">
            Cuidados
          </p>
          <div className="flex flex-wrap gap-1.5">
            <CareIndicator label="Castrado" active={cat.castrated} />
            <CareIndicator label="Vacinado" active={cat.vaccinated} />
            <CareIndicator label="Vermifugado" active={cat.dewormed} />
          </div>
        </div>

        {(cat.donorName ?? cat.donorWhatsapp) && (
          <div className="space-y-2">
            <p className="text-muted-foreground/80 text-[10px] font-semibold tracking-wider uppercase">
              Doador
            </p>
            <div className="space-y-1">
              {cat.donorName && (
                <p className="text-foreground/80 text-xs">{cat.donorName}</p>
              )}
              {cat.donorWhatsapp && (
                <a
                  href={`https://wa.me/${cat.donorWhatsapp.replace(/\D/g, '')}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-success inline-flex items-center gap-1 text-xs hover:underline"
                >
                  {formatPhone(cat.donorWhatsapp)}
                  <ExternalLink className="h-3 w-3" />
                </a>
              )}
            </div>
          </div>
        )}

        {cat.description && (
          <div className="space-y-2">
            <p className="text-muted-foreground/80 text-[10px] font-semibold tracking-wider uppercase">
              Descrição
            </p>
            <p className="text-foreground/80 line-clamp-2 leading-relaxed">
              {cat.description}
            </p>
          </div>
        )}
      </div>
    </div>
  )
}

function GroupExpandedContent({
  cats,
  groupDescription,
  onOpenPhotoPreview,
  orgHref,
}: {
  cats: Cat[]
  groupDescription?: string | null
  onOpenPhotoPreview: (cat: Cat) => void
  orgHref: (path: string) => Route
}) {
  const donor = cats[0]

  return (
    <div className="border-border/40 from-muted/30 to-muted/10 animate-in fade-in-0 slide-in-from-top-1 border-t bg-gradient-to-b px-4 py-3 duration-200">
      {groupDescription && (
        <div className="border-border/30 mb-3 border-b pb-3">
          <p className="text-muted-foreground/80 mb-1 text-[10px] font-semibold tracking-wider uppercase">
            Descrição do grupo
          </p>
          <p className="text-foreground/80 text-xs leading-relaxed">
            {groupDescription}
          </p>
        </div>
      )}
      {(donor?.donorName ?? donor?.donorWhatsapp) && (
        <div className="border-border/30 mb-3 flex items-center gap-3 border-b pb-3">
          <p className="text-muted-foreground/80 text-[10px] font-semibold tracking-wider uppercase">
            Doador
          </p>
          {donor.donorName && (
            <span className="text-foreground/80 text-xs">
              {donor.donorName}
            </span>
          )}
          {donor.donorWhatsapp && (
            <>
              {donor.donorName && (
                <span className="text-border text-xs">•</span>
              )}
              <a
                href={`https://wa.me/${donor.donorWhatsapp.replace(/\D/g, '')}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-success inline-flex items-center gap-1 text-xs hover:underline"
              >
                {formatPhone(donor.donorWhatsapp)}
                <ExternalLink className="h-3 w-3" />
              </a>
            </>
          )}
        </div>
      )}
      <div className="divide-border/30 space-y-0 divide-y">
        {cats.map((cat) => {
          const photos = resolveCatPhotos(cat)
          const photoCount = photos.length

          return (
            <div
              key={cat.id}
              className="flex items-start gap-3 py-3 first:pt-0 last:pb-0"
            >
              <div className="bg-muted border-border/40 relative h-14 w-14 shrink-0 overflow-hidden rounded-xl border shadow-sm">
                {cat.photoUrl ? (
                  <button
                    type="button"
                    onClick={() => onOpenPhotoPreview(cat)}
                    className="group/photo focus-visible:ring-primary relative h-full w-full focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-1"
                    aria-label={`Ver fotos de ${cat.name}`}
                  >
                    <img
                      src={cat.photoUrl}
                      alt={cat.name}
                      className="h-full w-full object-cover transition-transform duration-300 group-hover/photo:scale-110"
                      loading="lazy"
                    />
                    {photoCount > 1 && (
                      <span className="bg-foreground/70 absolute right-0.5 bottom-0.5 flex h-4 min-w-4 items-center justify-center rounded-md px-1 text-[9px] font-semibold text-white backdrop-blur-sm">
                        {photoCount}
                      </span>
                    )}
                  </button>
                ) : (
                  <div className="from-muted to-muted/60 flex h-full w-full items-center justify-center bg-gradient-to-br">
                    <CatIcon className="text-muted-foreground/60 h-5 w-5" />
                  </div>
                )}
              </div>

              <div className="min-w-0 flex-1 space-y-1.5">
                <div className="flex items-center gap-2">
                  <span className="text-foreground text-sm font-semibold">
                    {cat.name}
                  </span>
                  {cat.sex === 'male' ? (
                    <Mars className="h-3.5 w-3.5 text-blue-500" />
                  ) : cat.sex === 'female' ? (
                    <Venus className="h-3.5 w-3.5 text-pink-500" />
                  ) : (
                    <CircleHelp className="text-muted-foreground h-3.5 w-3.5" />
                  )}
                  <span className="text-muted-foreground text-xs tabular-nums">
                    {formatAge(cat.ageYears, cat.ageMonths)}
                  </span>
                  <Link
                    href={orgHref(`/admin/gatos/${cat.id}/editar`)}
                    className="text-muted-foreground hover:text-primary ml-auto inline-flex items-center gap-1 text-xs transition-colors"
                  >
                    <Pencil className="h-3 w-3" />
                    Editar
                  </Link>
                </div>
                <div className="flex flex-wrap gap-1.5">
                  <HealthBadge label="FIV" value={cat.fiv} />
                  <HealthBadge label="FeLV" value={cat.felv} />
                  <CareIndicator label="Castrado" active={cat.castrated} />
                  <CareIndicator label="Vacinado" active={cat.vaccinated} />
                  <CareIndicator label="Vermifugado" active={cat.dewormed} />
                </div>
                {cat.description && (
                  <p className="text-foreground/60 line-clamp-1 text-xs leading-relaxed">
                    {cat.description}
                  </p>
                )}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

function getColumns(
  onOpenPhotoPreview: (cat: Cat) => void,
  orgHref: (path: string) => Route
): ColumnDef<DisplayRow>[] {
  return [
    {
      id: 'expand',
      header: () => null,
      cell: ({ row }) => (
        <Button
          variant="ghost"
          size="icon"
          className={cn(
            'h-7 w-7 rounded-lg transition-all duration-200',
            row.getIsExpanded()
              ? 'bg-primary/10 text-primary'
              : 'text-muted-foreground hover:bg-muted hover:text-foreground'
          )}
          onClick={() => row.toggleExpanded()}
          aria-label={row.getIsExpanded() ? 'Recolher' : 'Expandir'}
        >
          <ChevronRight
            className={cn(
              'h-4 w-4 transition-transform duration-200',
              row.getIsExpanded() && 'rotate-90'
            )}
          />
        </Button>
      ),
      meta: { className: 'w-10 px-1.5' },
    },
    {
      id: 'cat',
      accessorKey: 'name',
      header: () => <ColumnHeader icon={CatIcon} label="Gato" />,
      cell: ({ row }) => {
        const data = row.original

        if (data.isGroupRow && data.groupCats) {
          const groupCats = data.groupCats
          const interestedCount = data.interestedCount ?? 0
          const hasPending = (data.pendingApplicationsCount ?? 0) > 0

          return (
            <div className="flex items-center gap-3">
              <div className="flex -space-x-2.5">
                {groupCats.slice(0, 3).map((cat, i) => (
                  <div
                    key={cat.id}
                    className="border-card bg-muted relative h-10 w-10 shrink-0 overflow-hidden rounded-full border-2 shadow-sm"
                    style={{ zIndex: groupCats.length - i }}
                  >
                    {cat.photoUrl ? (
                      <img
                        src={cat.photoUrl}
                        alt={cat.name}
                        className="h-full w-full object-cover"
                        loading="lazy"
                      />
                    ) : (
                      <div className="from-muted to-muted/60 flex h-full w-full items-center justify-center bg-gradient-to-br">
                        <CatIcon className="text-muted-foreground/60 h-4 w-4" />
                      </div>
                    )}
                  </div>
                ))}
                {groupCats.length > 3 && (
                  <div
                    className="border-card bg-muted text-muted-foreground relative flex h-10 w-10 shrink-0 items-center justify-center rounded-full border-2 text-xs font-medium shadow-sm"
                    style={{ zIndex: 0 }}
                  >
                    +{groupCats.length - 3}
                  </div>
                )}
              </div>

              <div className="min-w-0 space-y-0.5">
                <div className="flex items-center gap-1.5">
                  <p className="text-foreground truncate text-sm font-semibold leading-tight">
                    {formatGroupNames(groupCats)}
                  </p>
                  <Badge
                    variant="secondary"
                    className="shrink-0 gap-1 px-1.5 py-0 text-[10px] font-medium"
                  >
                    <Users className="h-2.5 w-2.5" />
                    Grupo
                  </Badge>
                </div>
                <p className="text-muted-foreground flex items-center gap-1 text-xs sm:hidden">
                  {groupCats.map((cat) => (
                    <span key={cat.id}>
                      {cat.sex === 'male' ? (
                        <Mars className="h-3 w-3 text-blue-500" />
                      ) : cat.sex === 'female' ? (
                        <Venus className="h-3 w-3 text-pink-500" />
                      ) : (
                        <CircleHelp className="text-muted-foreground h-3 w-3" />
                      )}
                    </span>
                  ))}
                </p>
                <Link
                  href={orgHref(
                    `/admin/gatos/grupo/${data.groupId}/interessados`
                  )}
                  className={cn(
                    'mt-1 inline-flex items-center gap-1.5 rounded-lg px-2 py-1 text-[11px] font-medium sm:hidden',
                    hasPending
                      ? 'bg-primary/10 text-primary'
                      : 'bg-muted/60 text-muted-foreground'
                  )}
                >
                  <Users className="h-3 w-3" />
                  <span>Interessados</span>
                  <span className="rounded-md bg-black/10 px-1 tabular-nums">
                    {interestedCount}
                  </span>
                </Link>
              </div>
            </div>
          )
        }

        const cat = data
        const photoCount = resolveCatPhotos(cat).length
        const interestedCount = cat.interestedCount ?? 0
        const hasPending = (cat.pendingApplicationsCount ?? 0) > 0

        return (
          <div className="flex items-center gap-3">
            <div className="bg-muted border-border/40 relative h-11 w-11 shrink-0 overflow-hidden rounded-xl border shadow-sm">
              {cat.photoUrl ? (
                <button
                  type="button"
                  onClick={() => onOpenPhotoPreview(cat)}
                  className="group/photo focus-visible:ring-primary relative h-full w-full focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-1"
                  aria-label={`Ver fotos de ${cat.name}`}
                >
                  <img
                    src={cat.photoUrl}
                    alt={cat.name}
                    className="h-full w-full object-cover transition-transform duration-300 group-hover/photo:scale-110"
                    loading="lazy"
                  />
                  {photoCount > 1 && (
                    <span className="bg-foreground/70 absolute right-0.5 bottom-0.5 flex h-4 min-w-4 items-center justify-center rounded-md px-1 text-[9px] font-semibold text-white backdrop-blur-sm">
                      {photoCount}
                    </span>
                  )}
                </button>
              ) : (
                <div className="from-muted to-muted/60 flex h-full w-full items-center justify-center bg-gradient-to-br">
                  <CatIcon className="text-muted-foreground/60 h-5 w-5" />
                </div>
              )}
            </div>

            <div className="min-w-0 space-y-0.5">
              <div className="flex items-center gap-1.5">
                <p className="text-foreground truncate text-sm font-semibold leading-tight">
                  {cat.name}
                </p>
                {cat.groupId && (
                  <Link
                    href={orgHref(
                      `/admin/gatos/grupo/${cat.groupId}/editar`
                    )}
                    onClick={(e) => e.stopPropagation()}
                  >
                    <Badge
                      variant="secondary"
                      className="hover:bg-primary/10 hover:text-primary gap-1 px-1.5 py-0 text-[10px] font-medium transition-colors"
                    >
                      <Users className="h-2.5 w-2.5" />
                      Grupo
                    </Badge>
                  </Link>
                )}
              </div>
              <p className="text-muted-foreground flex items-center gap-1.5 text-xs sm:hidden">
                {formatAge(cat.ageYears, cat.ageMonths)}
                <span className="text-border">•</span>
                {cat.sex === 'male' ? (
                  <Mars className="h-3 w-3 text-blue-500" />
                ) : cat.sex === 'female' ? (
                  <Venus className="h-3 w-3 text-pink-500" />
                ) : (
                  <CircleHelp className="text-muted-foreground h-3 w-3" />
                )}
              </p>

              <Link
                href={orgHref(
                  cat.groupId
                    ? `/admin/gatos/grupo/${cat.groupId}/interessados`
                    : `/admin/gatos/${cat.id}/interessados`
                )}
                className={cn(
                  'mt-1 inline-flex items-center gap-1.5 rounded-lg px-2 py-1 text-[11px] font-medium sm:hidden',
                  hasPending
                    ? 'bg-primary/10 text-primary'
                    : 'bg-muted/60 text-muted-foreground'
                )}
              >
                <Users className="h-3 w-3" />
                <span>Interessados</span>
                <span className="rounded-md bg-black/10 px-1 tabular-nums">
                  {interestedCount}
                </span>
              </Link>
            </div>
          </div>
        )
      },
      meta: { className: 'min-w-[140px]' },
    },
    {
      id: 'age',
      accessorFn: (row) => (row.ageYears ?? 0) * 12 + (row.ageMonths ?? 0),
      header: () => (
        <span className="text-muted-foreground hidden text-xs font-medium sm:inline">
          Idade
        </span>
      ),
      cell: ({ row }) => {
        if (row.original.isGroupRow) {
          return <span className="hidden sm:inline" />
        }
        return (
          <span className="text-foreground/80 hidden text-sm tabular-nums sm:inline">
            {formatAge(row.original.ageYears, row.original.ageMonths)}
          </span>
        )
      },
      meta: { className: 'hidden sm:table-cell w-20 text-center' },
    },
    {
      id: 'sex',
      accessorKey: 'sex',
      header: () => (
        <span className="text-muted-foreground hidden text-xs font-medium md:inline">
          Sexo
        </span>
      ),
      cell: ({ row }) => {
        if (row.original.isGroupRow && row.original.groupCats) {
          return (
            <div className="hidden items-center gap-1 md:flex">
              {row.original.groupCats.map((cat) => (
                <span key={cat.id}>
                  {cat.sex === 'male' ? (
                    <Mars className="h-3.5 w-3.5 text-blue-600" />
                  ) : cat.sex === 'female' ? (
                    <Venus className="h-3.5 w-3.5 text-pink-500" />
                  ) : (
                    <CircleHelp className="text-muted-foreground h-3.5 w-3.5" />
                  )}
                </span>
              ))}
            </div>
          )
        }

        const sex = row.original.sex
        return (
          <span
            className={cn(
              'hidden items-center gap-1.5 text-sm md:inline-flex',
              sex === 'male' ? 'text-blue-600' : sex === 'female' ? 'text-pink-500' : 'text-muted-foreground'
            )}
          >
            {sex === 'male' ? (
              <>
                <Mars className="h-3.5 w-3.5" />
                <span className="text-foreground/70 text-xs">Macho</span>
              </>
            ) : sex === 'female' ? (
              <>
                <Venus className="h-3.5 w-3.5" />
                <span className="text-foreground/70 text-xs">Fêmea</span>
              </>
            ) : (
              <>
                <CircleHelp className="h-3.5 w-3.5" />
                <span className="text-foreground/70 text-xs">Desc.</span>
              </>
            )}
          </span>
        )
      },
      meta: { className: 'hidden md:table-cell w-24' },
    },
    {
      id: 'interested',
      accessorKey: 'interestedCount',
      header: () => (
        <span className="text-muted-foreground hidden items-center gap-1.5 text-xs font-medium sm:inline-flex">
          <MessageCircle className="h-3.5 w-3.5" />
          Interessados
        </span>
      ),
      cell: ({ row }) => {
        const data = row.original
        const count = data.interestedCount ?? 0
        const hasInterested = count > 0
        const hasPending = (data.pendingApplicationsCount ?? 0) > 0

        const href =
          data.isGroupRow && data.groupId
            ? orgHref(`/admin/gatos/grupo/${data.groupId}/interessados`)
            : orgHref(
                data.groupId
                  ? `/admin/gatos/grupo/${data.groupId}/interessados`
                  : `/admin/gatos/${data.id}/interessados`
              )

        return (
          <div className="hidden sm:block">
            <Link
              href={href}
              className={cn(
                'group/int relative inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-xs font-medium transition-all duration-200',
                hasInterested
                  ? 'bg-primary/10 text-primary hover:bg-primary/20 hover:shadow-sm'
                  : 'bg-muted/50 text-muted-foreground hover:bg-muted hover:text-foreground'
              )}
            >
              <Users
                className={cn(
                  'h-3.5 w-3.5 transition-transform duration-200 group-hover/int:scale-110',
                  hasInterested && 'text-primary'
                )}
              />
              <span className="tabular-nums">{count}</span>
              {hasPending && (
                <span className="bg-primary absolute -top-1 -right-1 flex h-2 w-2 items-center justify-center rounded-full">
                  <span className="bg-primary absolute inline-flex h-full w-full animate-ping rounded-full opacity-75" />
                </span>
              )}
            </Link>
          </div>
        )
      },
      meta: { className: 'hidden sm:table-cell w-28' },
    },
    {
      id: 'status',
      accessorKey: 'status',
      header: () => (
        <span className="text-muted-foreground hidden text-xs font-medium sm:inline">
          Status
        </span>
      ),
      cell: ({ row }) => {
        const config = getStatusConfig(row.original.status)
        return (
          <Badge
            variant={config.variant}
            className="hidden gap-1.5 px-2 py-0.5 text-[11px] font-medium whitespace-nowrap sm:inline-flex"
          >
            <span
              className={cn(
                'h-1.5 w-1.5 shrink-0 rounded-full',
                config.dotClass
              )}
            />
            {config.label}
          </Badge>
        )
      },
      meta: { className: 'hidden sm:table-cell w-28' },
    },
    {
      id: 'actions',
      header: () => null,
      cell: ({ row }) => (
        <div className="flex justify-center">
          <CatActionsMenu
            cat={row.original}
            groupCats={
              row.original.isGroupRow ? row.original.groupCats : undefined
            }
          />
        </div>
      ),
      meta: {
        className: 'w-12 px-1',
        headerClassName: 'w-12',
      },
    },
  ]
}

export function CatsDataTable({ cats }: CatsDataTableProps) {
  const slug = useOrgSlug()
  const isCustomDomain = useIsCustomDomain()
  const orgHref = useCallback(
    (path: string) => buildOrgHref(path, slug, isCustomDomain) as Route,
    [slug, isCustomDomain]
  )

  const displayRows = useMemo(() => buildDisplayRows(cats), [cats])

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

  const columns = useMemo(
    () => getColumns(openPhotoPreview, orgHref),
    [openPhotoPreview, orgHref]
  )

  return (
    <>
      <DataTable
        columns={columns}
        data={displayRows}
        className="border-border/50 bg-card shadow-warm-sm overflow-hidden rounded-xl border"
        renderExpandedRow={(row: Row<DisplayRow>) => {
          if (row.original.isGroupRow && row.original.groupCats) {
            return (
              <GroupExpandedContent
                cats={row.original.groupCats}
                groupDescription={row.original.groupDescription}
                onOpenPhotoPreview={openPhotoPreview}
                orgHref={orgHref}
              />
            )
          }
          return <ExpandedContent cat={row.original} />
        }}
      />

      <Sheet open={Boolean(previewState)} onOpenChange={closePhotoPreview}>
        <SheetContent
          side="right"
          className="flex w-full flex-col overflow-hidden p-0 sm:max-w-md"
        >
          {previewState ? (
            <>
              <SheetHeader className="border-border/40 shrink-0 border-b px-5 py-4 pr-12">
                <div className="flex items-center gap-3">
                  <div className="from-primary/20 to-primary/10 flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br">
                    <CatIcon className="text-primary h-5 w-5" />
                  </div>
                  <div>
                    <SheetTitle className="text-display text-lg">
                      {previewState.cat.name}
                    </SheetTitle>
                    <SheetDescription className="text-xs">
                      {activePhoto
                        ? `Foto ${previewState.index + 1} de ${previewPhotos.length}`
                        : 'Sem foto disponível'}
                    </SheetDescription>
                  </div>
                </div>
              </SheetHeader>

              <div className="flex flex-1 flex-col gap-4 overflow-y-auto p-4">
                <div className="bg-muted/30 border-border/40 relative overflow-hidden rounded-2xl border">
                  <div className="aspect-[4/3] w-full">
                    {activePhoto ? (
                      <img
                        src={activePhoto.url}
                        alt={`Foto ${previewState.index + 1} de ${previewState.cat.name}`}
                        className="h-full w-full object-contain"
                      />
                    ) : (
                      <div className="text-muted-foreground flex h-full w-full flex-col items-center justify-center gap-2 text-sm">
                        <ImageIcon className="h-8 w-8 opacity-40" />
                        <span>Sem foto</span>
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
                        className="border-border/40 absolute top-1/2 left-3 h-9 w-9 -translate-y-1/2 rounded-full border shadow-md backdrop-blur-sm transition-transform hover:scale-105"
                        aria-label="Foto anterior"
                      >
                        <ChevronLeft className="h-5 w-5" />
                      </Button>
                      <Button
                        type="button"
                        variant="secondary"
                        size="icon"
                        onClick={goToNextPhoto}
                        className="border-border/40 absolute top-1/2 right-3 h-9 w-9 -translate-y-1/2 rounded-full border shadow-md backdrop-blur-sm transition-transform hover:scale-105"
                        aria-label="Próxima foto"
                      >
                        <ChevronRight className="h-5 w-5" />
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
                            'relative h-16 w-16 shrink-0 overflow-hidden rounded-xl border-2 shadow-sm transition-all duration-200',
                            isActive
                              ? 'border-primary ring-primary/20 scale-105 ring-4'
                              : 'border-transparent opacity-70 hover:opacity-100'
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
            </>
          ) : null}
        </SheetContent>
      </Sheet>
    </>
  )
}
