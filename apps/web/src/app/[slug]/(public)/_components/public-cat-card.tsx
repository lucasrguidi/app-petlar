'use client'

import {
  Bug,
  Cat,
  ChevronLeft,
  ChevronRight,
  Heart,
  Mars,
  Scissors,
  Sparkles,
  Syringe,
  Venus,
} from 'lucide-react'
import { type Route } from 'next'
import Link from 'next/link'
import { useMemo, useState } from 'react'

import { Button } from '@/components/ui/button'
import { useOrgSlug } from '@/hooks/use-org-slug'
import { cn } from '@/lib/utils'

export interface PublicCatCardData {
  id: string
  formId: string | null
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
  photoUrl: string | null
  photos: Array<{
    id: string
    url: string
    order: number
  }>
}

interface PublicCatCardProps {
  cat: PublicCatCardData
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
  return { text: 'Não testado', color: 'text-[#8B5A2B]/60' }
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
        'inline-flex items-center gap-1.5 rounded-full px-2.5 py-1',
        value
          ? 'bg-emerald-100 text-emerald-700'
          : 'bg-[#AEC7E2]/40 text-[#8B5A2B]/60'
      )}
    >
      <Icon className="h-3 w-3" />
      <span
        className={cn(
          'text-[11px] font-medium',
          !value && 'line-through decoration-[#8B5A2B]/40'
        )}
      >
        {label}
      </span>
    </div>
  )
}

export function PublicCatCard({ cat }: PublicCatCardProps) {
  const slug = useOrgSlug()
  const [expandedDescription, setExpandedDescription] = useState(false)
  const [currentPhotoIndex, setCurrentPhotoIndex] = useState(0)
  const [isHovered, setIsHovered] = useState(false)

  const description =
    cat.description?.trim() ||
    'Ainda não temos uma descrição detalhada deste gatinho.'
  const canExpandDescription = description.length > 150

  const sortedPhotos = useMemo(
    () => [...cat.photos].sort((a, b) => a.order - b.order),
    [cat.photos]
  )
  const photoUrls = useMemo(() => {
    if (sortedPhotos.length > 0) {
      return sortedPhotos.map((photo) => photo.url)
    }
    return cat.photoUrl ? [cat.photoUrl] : []
  }, [sortedPhotos, cat.photoUrl])
  const currentPhoto = photoUrls[currentPhotoIndex] ?? null

  const hasPhotoCarousel = photoUrls.length > 1

  const goToPreviousPhoto = () => {
    if (!hasPhotoCarousel) return
    setCurrentPhotoIndex((current) =>
      current === 0 ? photoUrls.length - 1 : current - 1
    )
  }

  const goToNextPhoto = () => {
    if (!hasPhotoCarousel) return
    setCurrentPhotoIndex((current) =>
      current === photoUrls.length - 1 ? 0 : current + 1
    )
  }

  const fivResult = formatTestResult(cat.fiv)
  const felvResult = formatTestResult(cat.felv)

  return (
    <div
      className={cn(
        'group relative flex h-full flex-col overflow-hidden rounded-3xl',
        'bg-white/90 backdrop-blur-sm',
        'shadow-xl shadow-[#783201]/5 transition-all duration-300',
        'hover:shadow-2xl hover:shadow-[#E35915]/10',
        'hover:-translate-y-1'
      )}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Photo area */}
      <div className="relative h-56 overflow-hidden bg-gradient-to-br from-[#AEC7E2]/30 to-white sm:h-60">
        {currentPhoto ? (
          <>
            {/* Blurred background */}
            <img
              src={currentPhoto}
              alt=""
              aria-hidden
              className="pointer-events-none absolute inset-0 h-full w-full scale-110 object-cover opacity-30 blur-xl"
              loading="lazy"
            />

            {/* Main photo */}
            <img
              src={currentPhoto}
              alt={`Foto de ${cat.name}`}
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
            <div className="flex flex-col items-center gap-2 text-[#8B5A2B]/40">
              <Cat className="h-12 w-12" />
              <span className="text-sm">Sem foto</span>
            </div>
          </div>
        )}

        {/* Availability badge */}
        <div
          className={cn(
            'absolute top-3 left-3 z-20',
            'inline-flex items-center gap-1.5 rounded-full px-3 py-1.5',
            'bg-emerald-500/90 backdrop-blur-sm',
            'shadow-lg shadow-emerald-500/25'
          )}
        >
          <Sparkles className="h-3 w-3 text-white" />
          <span className="text-xs font-semibold text-white">Disponível</span>
        </div>

        {/* Sex badge */}
        <div
          className={cn(
            'absolute top-3 right-3 z-20',
            'inline-flex items-center gap-1 rounded-full px-2.5 py-1',
            'shadow-sm backdrop-blur-sm',
            cat.sex === 'male'
              ? 'bg-blue-500/90 text-white'
              : 'bg-pink-500/90 text-white'
          )}
        >
          {cat.sex === 'male' ? (
            <Mars className="h-3.5 w-3.5" />
          ) : (
            <Venus className="h-3.5 w-3.5" />
          )}
          <span className="text-xs font-medium">
            {cat.sex === 'male' ? 'Macho' : 'Fêmea'}
          </span>
        </div>

        {/* Photo navigation */}
        {hasPhotoCarousel && (
          <>
            <div className="pointer-events-none absolute inset-x-0 bottom-0 z-10 h-20 bg-gradient-to-t from-black/30 to-transparent" />

            <div
              className={cn(
                'absolute inset-x-0 bottom-3 z-20 flex items-center justify-between px-3',
                'opacity-0 transition-opacity duration-200',
                isHovered && 'opacity-100'
              )}
            >
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation()
                  goToPreviousPhoto()
                }}
                className="flex h-8 w-8 items-center justify-center rounded-full bg-white/90 shadow-lg transition-transform hover:scale-110"
                aria-label="Foto anterior"
              >
                <ChevronLeft className="h-4 w-4 text-[#783201]" />
              </button>

              <div className="flex items-center gap-1.5">
                {photoUrls.map((_, index) => (
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
                <ChevronRight className="h-4 w-4 text-[#783201]" />
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
            className="text-xl font-bold text-[#783201]"
            style={{ fontFamily: 'var(--font-display)' }}
          >
            {cat.name}
          </h3>
          <p className="text-sm text-[#8B5A2B]/70">
            {formatAge(cat.ageYears, cat.ageMonths)}
          </p>
        </div>

        {/* Description */}
        <div className="space-y-1.5">
          <p
            className={cn(
              'text-sm leading-relaxed text-[#783201]/80',
              !expandedDescription && canExpandDescription && 'line-clamp-2'
            )}
          >
            {description}
          </p>
          {canExpandDescription && (
            <button
              type="button"
              onClick={() => setExpandedDescription(!expandedDescription)}
              className="text-xs font-semibold text-[#E35915] hover:underline"
            >
              {expandedDescription ? 'Ver menos' : 'Ver mais'}
            </button>
          )}
        </div>

        {/* Health info */}
        <div
          className={cn(
            'space-y-3 rounded-2xl p-4',
            'bg-gradient-to-br from-[#AEC7E2]/20 to-white',
            'border border-[#AEC7E2]/30'
          )}
        >
          {/* Test results */}
          <div className="flex items-center gap-4 text-xs">
            <div className="flex items-center gap-1.5">
              <span className="font-medium text-[#8B5A2B]/60">FIV:</span>
              <span className={cn('font-semibold', fivResult.color)}>
                {fivResult.text}
              </span>
            </div>
            <div className="h-3 w-px bg-[#AEC7E2]/50" />
            <div className="flex items-center gap-1.5">
              <span className="font-medium text-[#8B5A2B]/60">FeLV:</span>
              <span className={cn('font-semibold', felvResult.color)}>
                {felvResult.text}
              </span>
            </div>
          </div>

          {/* Health indicators */}
          <div className="flex flex-wrap gap-1.5">
            <HealthBadge
              icon={Scissors}
              label="Castrado"
              value={cat.castrated}
            />
            <HealthBadge
              icon={Syringe}
              label="Vacinado"
              value={cat.vaccinated}
            />
            <HealthBadge icon={Bug} label="Vermifugado" value={cat.dewormed} />
          </div>

          {/* Health notes */}
          {(cat.vaccinationNotes || cat.dewormingNotes) && (
            <p className="border-t border-[#AEC7E2]/30 pt-2 text-xs leading-relaxed text-[#8B5A2B]/60">
              {cat.vaccinationNotes && (
                <span>Vacinação: {cat.vaccinationNotes}</span>
              )}
              {cat.vaccinationNotes && cat.dewormingNotes && ' · '}
              {cat.dewormingNotes && (
                <span>Vermífugo: {cat.dewormingNotes}</span>
              )}
            </p>
          )}
        </div>

        {/* CTA */}
        <Button
          asChild
          className={cn(
            'mt-auto h-12 w-full rounded-2xl text-base',
            'bg-gradient-to-r from-[#E35915] to-[#F07B3D]',
            'shadow-lg shadow-[#E35915]/20',
            'transition-all duration-200',
            'hover:shadow-xl hover:shadow-[#E35915]/30',
            'hover:scale-[1.01] active:scale-[0.99]'
          )}
        >
          <Link href={`/${slug}/candidatura/${cat.id}` as Route}>
            <Heart
              className={cn(
                'mr-2 h-4 w-4 transition-transform',
                isHovered && 'scale-110'
              )}
            />
            Quero adotar {cat.sex === 'female' ? 'a' : 'o'} {cat.name}
          </Link>
        </Button>
      </div>
    </div>
  )
}
