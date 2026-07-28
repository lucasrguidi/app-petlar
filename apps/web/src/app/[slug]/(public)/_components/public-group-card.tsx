'use client'

import {
  Bug,
  Cat,
  ChevronLeft,
  ChevronRight,
  Heart,
  Mars,
  Scissors,
  Syringe,
  Users,
  Venus,
} from 'lucide-react'
import Link from 'next/link'
import { useMemo, useState } from 'react'

import { Button } from '@/components/ui/button'
import { useOrgHref } from '@/hooks/use-org-href'
import { cn } from '@/lib/utils'

interface GroupCatData {
  id: string
  name: string
  ageYears: number | null
  ageMonths: number | null
  sex: 'male' | 'female'
  fiv: 'positive' | 'negative' | 'not_tested'
  felv: 'positive' | 'negative' | 'not_tested'
  castrated: boolean
  vaccinated: boolean
  vaccinationNotes: string | null
  dewormed: boolean
  dewormingNotes: string | null
  description: string | null
  photos: Array<{
    id: string
    url: string
    order: number
  }>
}

export interface PublicGroupCardData {
  id: string
  createdAt: Date | string
  cats: GroupCatData[]
}

interface PublicGroupCardProps {
  group: PublicGroupCardData
}

function formatAge(years: number | null, months: number | null): string {
  if (years && years > 0) {
    if (months && months > 0) {
      return `${years} ano${years > 1 ? 's' : ''} e ${months} ${months > 1 ? 'meses' : 'mês'}`
    }
    return `${years} ano${years > 1 ? 's' : ''}`
  }

  if (months && months > 0) {
    return `${months} ${months > 1 ? 'meses' : 'mês'}`
  }

  return 'Idade não informada'
}

function formatTestResult(result: 'positive' | 'negative' | 'not_tested'): {
  text: string
  color: string
} {
  if (result === 'positive')
    return { text: 'Positivo', color: 'text-amber-600' }
  if (result === 'negative')
    return { text: 'Negativo', color: 'text-emerald-600' }
  return { text: 'Não testado', color: 'text-muted-foreground/60' }
}

function HealthBadge({
  icon: Icon,
  label,
  value,
}: {
  icon: typeof Scissors
  label: string
  value: boolean
}) {
  return (
    <div
      className={cn(
        'inline-flex items-center gap-1 rounded-full px-2 py-0.5',
        value
          ? 'bg-emerald-100 text-emerald-700'
          : 'bg-background/40 text-muted-foreground/60'
      )}
    >
      <Icon className="h-2.5 w-2.5" />
      <span
        className={cn(
          'text-[10px] font-medium',
          !value && 'line-through decoration-muted-foreground/40'
        )}
      >
        {label}
      </span>
    </div>
  )
}

function CatHealthBlock({ cat }: { cat: GroupCatData }) {
  const fivResult = formatTestResult(cat.fiv)
  const felvResult = formatTestResult(cat.felv)

  return (
    <div className="space-y-2 rounded-xl border border-background/30 bg-gradient-to-br from-background/10 to-white p-3">
      <div className="flex items-center gap-2">
        <span
          className="text-sm font-semibold text-foreground"
          style={{ fontFamily: 'var(--font-display)' }}
        >
          {cat.name}
        </span>
        <span
          className={cn(
            'inline-flex items-center gap-0.5 rounded-full px-1.5 py-0.5',
            'text-[10px] font-medium',
            cat.sex === 'male'
              ? 'bg-blue-500/15 text-blue-700'
              : 'bg-pink-500/15 text-pink-700'
          )}
        >
          {cat.sex === 'male' ? (
            <Mars className="h-2.5 w-2.5" />
          ) : (
            <Venus className="h-2.5 w-2.5" />
          )}
        </span>
        <span className="text-xs text-muted-foreground/60">
          {formatAge(cat.ageYears, cat.ageMonths)}
        </span>
      </div>

      <div className="flex items-center gap-3 text-[10px]">
        <div className="flex items-center gap-1">
          <span className="font-medium text-muted-foreground/60">FIV:</span>
          <span className={cn('font-semibold', fivResult.color)}>
            {fivResult.text}
          </span>
        </div>
        <div className="h-2.5 w-px bg-background/50" />
        <div className="flex items-center gap-1">
          <span className="font-medium text-muted-foreground/60">FeLV:</span>
          <span className={cn('font-semibold', felvResult.color)}>
            {felvResult.text}
          </span>
        </div>
      </div>

      <div className="flex flex-wrap gap-1">
        <HealthBadge icon={Scissors} label="Castrado" value={cat.castrated} />
        <HealthBadge icon={Syringe} label="Vacinado" value={cat.vaccinated} />
        <HealthBadge icon={Bug} label="Vermifugado" value={cat.dewormed} />
      </div>
    </div>
  )
}

export function PublicGroupCard({ group }: PublicGroupCardProps) {
  const adoptionHref = useOrgHref(`/candidatura/grupo/${group.id}`)
  const [currentPhotoIndex, setCurrentPhotoIndex] = useState(0)
  const [isHovered, setIsHovered] = useState(false)
  const [expandedDescriptions, setExpandedDescriptions] = useState(false)

  const allPhotos = useMemo(() => {
    const photos: Array<{ url: string; catName: string }> = []
    for (const cat of group.cats) {
      const sorted = [...cat.photos].sort((a, b) => a.order - b.order)
      for (const photo of sorted) {
        photos.push({ url: photo.url, catName: cat.name })
      }
    }
    return photos
  }, [group.cats])

  const currentPhoto = allPhotos[currentPhotoIndex] ?? null
  const hasPhotoCarousel = allPhotos.length > 1

  const goToPreviousPhoto = () => {
    if (!hasPhotoCarousel) return
    setCurrentPhotoIndex((current) =>
      current === 0 ? allPhotos.length - 1 : current - 1
    )
  }

  const goToNextPhoto = () => {
    if (!hasPhotoCarousel) return
    setCurrentPhotoIndex((current) =>
      current === allPhotos.length - 1 ? 0 : current + 1
    )
  }

  const names = group.cats.map((c) => c.name).join(' & ')

  const descriptions = group.cats
    .map((c) => c.description?.trim())
    .filter(Boolean)
  const hasDescriptions = descriptions.length > 0

  return (
    <div
      className={cn(
        'group relative flex h-full flex-col overflow-hidden rounded-3xl',
        'bg-white/90 backdrop-blur-sm',
        'shadow-xl shadow-foreground/5 transition-all duration-300',
        'hover:shadow-2xl hover:shadow-primary/10',
        'hover:-translate-y-1'
      )}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Photo area */}
      <div className="relative h-56 overflow-hidden bg-gradient-to-br from-background/30 to-white sm:h-60">
        {currentPhoto ? (
          <>
            <img
              src={currentPhoto.url}
              alt=""
              aria-hidden
              className="pointer-events-none absolute inset-0 h-full w-full scale-110 object-cover opacity-30 blur-xl"
              loading="lazy"
            />
            <img
              src={currentPhoto.url}
              alt={`Foto de ${currentPhoto.catName}`}
              className={cn(
                'relative z-0 h-full w-full object-contain object-center',
                'transition-transform duration-500',
                isHovered && 'scale-[1.02]'
              )}
              loading="lazy"
            />
          </>
        ) : (
          <div className="flex h-full items-center justify-center">
            <div className="flex flex-col items-center gap-2 text-muted-foreground/40">
              <Cat className="h-12 w-12" />
              <span className="text-sm">Sem foto</span>
            </div>
          </div>
        )}

        {/* Joint adoption badge */}
        <div
          className={cn(
            'absolute top-3 left-3 z-20',
            'inline-flex items-center gap-1.5 rounded-full px-3 py-1.5',
            'bg-primary/90 backdrop-blur-sm',
            'shadow-lg shadow-primary/25'
          )}
        >
          <Users className="h-3 w-3 text-white" />
          <span className="text-xs font-semibold text-white">
            Adoção conjunta
          </span>
        </div>

        {/* Cat name indicator on photo */}
        {currentPhoto && (
          <div
            className={cn(
              'absolute top-3 right-3 z-20',
              'inline-flex items-center gap-1 rounded-full px-2.5 py-1',
              'bg-black/50 backdrop-blur-sm',
              'shadow-sm'
            )}
          >
            <span className="text-xs font-medium text-white">
              {currentPhoto.catName}
            </span>
          </div>
        )}

        {/* Photo navigation */}
        {hasPhotoCarousel && (
          <>
            <div className="pointer-events-none absolute inset-x-0 bottom-0 z-10 h-20 bg-gradient-to-t from-black/30 to-transparent" />

            <div className="absolute inset-x-0 bottom-3 z-20 flex items-center justify-between px-3">
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation()
                  goToPreviousPhoto()
                }}
                className="flex h-8 w-8 items-center justify-center rounded-full bg-white/90 shadow-lg transition-transform hover:scale-110"
                aria-label="Foto anterior"
              >
                <ChevronLeft className="h-4 w-4 text-foreground" />
              </button>

              <div className="flex items-center gap-1.5">
                {allPhotos.map((_, index) => (
                  <button
                    key={`dot-${index}`}
                    onClick={(e) => {
                      e.stopPropagation()
                      setCurrentPhotoIndex(index)
                    }}
                    className={cn(
                      'h-2 w-2 rounded-full transition-all',
                      index === currentPhotoIndex
                        ? 'w-4 bg-white'
                        : 'bg-white/50 hover:bg-white/75'
                    )}
                    aria-label={`Ver foto ${index + 1}`}
                  />
                ))}
              </div>

              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation()
                  goToNextPhoto()
                }}
                className="flex h-8 w-8 items-center justify-center rounded-full bg-white/90 shadow-lg transition-transform hover:scale-110"
                aria-label="Próxima foto"
              >
                <ChevronRight className="h-4 w-4 text-foreground" />
              </button>
            </div>
          </>
        )}
      </div>

      {/* Content */}
      <div className="flex flex-1 flex-col gap-4 p-5">
        {/* Header */}
        <div>
          <h3
            className="text-xl font-bold text-foreground"
            style={{ fontFamily: 'var(--font-display)' }}
          >
            {names}
          </h3>
          <p className="text-sm text-muted-foreground/70">
            {group.cats.length} gatinhos para adoção conjunta
          </p>
        </div>

        {/* Descriptions (collapsible) */}
        {hasDescriptions && (
          <div className="space-y-1.5">
            <div
              className={cn(
                'space-y-1 text-sm leading-relaxed text-foreground/80',
                !expandedDescriptions && 'line-clamp-3'
              )}
            >
              {group.cats.map(
                (cat) =>
                  cat.description?.trim() && (
                    <p key={cat.id}>
                      <span className="font-medium">{cat.name}:</span>{' '}
                      {cat.description.trim()}
                    </p>
                  )
              )}
            </div>
            <button
              type="button"
              onClick={() => setExpandedDescriptions(!expandedDescriptions)}
              className="text-xs font-semibold text-primary hover:underline"
            >
              {expandedDescriptions ? 'Ver menos' : 'Ver mais'}
            </button>
          </div>
        )}

        {/* Health info per cat */}
        <div
          className={cn(
            'space-y-2 rounded-2xl p-3',
            'bg-gradient-to-br from-background/20 to-white',
            'border border-background/30'
          )}
        >
          {group.cats.map((cat) => (
            <CatHealthBlock key={cat.id} cat={cat} />
          ))}
        </div>

        {/* CTA */}
        <Button
          asChild
          className={cn(
            'mt-auto h-12 w-full rounded-2xl text-base',
            'bg-gradient-to-r from-primary to-accent',
            'shadow-lg shadow-primary/20',
            'transition-all duration-200',
            'hover:shadow-xl hover:shadow-primary/30',
            'hover:scale-[1.01] active:scale-[0.99]'
          )}
        >
          <Link href={adoptionHref}>
            <Heart
              className={cn(
                'mr-2 h-4 w-4 transition-transform',
                isHovered && 'scale-110'
              )}
            />
            Quero adotar {names}
          </Link>
        </Button>
      </div>
    </div>
  )
}
