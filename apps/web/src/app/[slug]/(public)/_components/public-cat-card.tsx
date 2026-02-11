'use client'

import {
  Bug,
  Cat,
  Heart,
  Mars,
  PawPrint,
  Scissors,
  Syringe,
  Venus,
  type LucideIcon,
} from 'lucide-react'
import { useMemo, useState } from 'react'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
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
  onAdoptClick: (cat: PublicCatCardData) => void
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

function formatTestResult(result: 'positive' | 'negative' | 'not_tested'): string {
  if (result === 'positive') return 'Positivo'
  if (result === 'negative') return 'Negativo'
  return 'Não testado'
}

function formatYesNo(value: boolean): string {
  return value ? 'Sim' : 'Não'
}

function SexBadge({ sex }: { sex: 'male' | 'female' }) {
  if (sex === 'male') {
    return (
      <Badge className="gap-1 border-0 bg-[#3B82F6] text-white hover:bg-[#3B82F6]">
        <Mars className="h-3.5 w-3.5" />
        Macho
      </Badge>
    )
  }

  return (
    <Badge className="gap-1 border-0 bg-[#E34AA5] text-white hover:bg-[#E34AA5]">
      <Venus className="h-3.5 w-3.5" />
      Fêmea
    </Badge>
  )
}

function HealthBooleanChip({
  icon: Icon,
  label,
  value,
}: {
  icon: LucideIcon
  label: string
  value: boolean
}) {
  return (
    <Badge variant="secondary" className="gap-1 text-[11px]">
      <Icon className="h-3 w-3" />
      {label}: {formatYesNo(value)}
    </Badge>
  )
}

export function PublicCatCard({ cat, onAdoptClick }: PublicCatCardProps) {
  const [expandedDescription, setExpandedDescription] = useState(false)
  const [currentPhotoIndex, setCurrentPhotoIndex] = useState(0)

  const description =
    cat.description?.trim() ||
    'Ainda não temos uma descrição detalhada deste gatinho.'
  const canExpandDescription = description.length > 180

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

  return (
    <Card className="bg-card/95 shadow-warm-lg flex h-full flex-col overflow-hidden rounded-2xl border border-border/60">
      <div className="from-muted/20 to-muted/5 relative h-56 bg-gradient-to-br sm:h-60 lg:h-56">
        {currentPhoto ? (
          <>
            {/* Blurred fill keeps the frame visually full without hard crop */}
            <img
              src={currentPhoto}
              alt=""
              aria-hidden
              className="pointer-events-none absolute inset-0 h-full w-full scale-105 object-cover opacity-45 blur-sm"
              loading="lazy"
            />

            {/* Foreground image preserves full photo inside a fixed frame */}
            <img
              src={currentPhoto}
              alt={`Foto de ${cat.name}`}
              className="pointer-events-none relative z-0 h-full w-full object-contain object-center"
              loading="lazy"
            />
          </>
        ) : (
          <div className="text-muted-foreground flex h-full items-center justify-center">
            <div className="flex flex-col items-center gap-2">
              <Cat className="h-10 w-10" />
              <span className="text-xs">Sem foto</span>
            </div>
          </div>
        )}

        <Badge
          variant="success"
          className="absolute top-3 left-3 z-20 border border-success/20 bg-success/90 text-white"
        >
          Disponível para adoção
        </Badge>

        {hasPhotoCarousel && (
          <>
            <div className="from-black/25 pointer-events-none absolute inset-x-0 bottom-0 z-10 h-14 bg-gradient-to-t to-transparent" />

            <div className="absolute inset-x-0 bottom-2 z-20 flex items-center justify-between px-2">
              <Button
                type="button"
                variant="secondary"
                size="icon"
                className="h-8 w-8 rounded-full bg-card/90"
                onClick={goToPreviousPhoto}
                aria-label={`Ver foto anterior de ${cat.name}`}
              >
                <span aria-hidden>&lsaquo;</span>
              </Button>

              <div className="flex items-center gap-1">
                {photoUrls.map((_, index) => (
                  <span
                    key={`${cat.id}-photo-dot-${index}`}
                    className={cn(
                      'h-1.5 w-1.5 rounded-full transition-colors',
                      index === currentPhotoIndex ? 'bg-primary' : 'bg-card/70'
                    )}
                  />
                ))}
              </div>

              <Button
                type="button"
                variant="secondary"
                size="icon"
                className="h-8 w-8 rounded-full bg-card/90"
                onClick={goToNextPhoto}
                aria-label={`Ver próxima foto de ${cat.name}`}
              >
                <span aria-hidden>&rsaquo;</span>
              </Button>
            </div>
          </>
        )}
      </div>

      <CardContent className="flex flex-1 flex-col gap-3.5 p-4">
        <div className="space-y-1.5">
          <div className="flex items-start justify-between gap-2">
            <h3 className="text-display text-xl leading-tight font-semibold">
              {cat.name}
            </h3>
            <SexBadge sex={cat.sex} />
          </div>
          <p className="text-muted-foreground text-sm">
            {formatAge(cat.ageYears, cat.ageMonths)}
          </p>
        </div>

        <div className="space-y-1.5">
          <p className="text-muted-foreground text-xs font-semibold uppercase">
            Sobre este gatinho
          </p>
          <p
            className={cn(
              'text-sm leading-relaxed',
              !expandedDescription && canExpandDescription && 'line-clamp-3'
            )}
          >
            {description}
          </p>
          {canExpandDescription && (
            <button
              type="button"
              onClick={() => setExpandedDescription((current) => !current)}
              className="text-primary text-xs font-semibold hover:underline"
            >
              {expandedDescription ? 'Ver menos' : 'Ver mais'}
            </button>
          )}
        </div>

        <div className="rounded-xl border border-border/60 bg-muted/15 p-3">
          <p className="text-muted-foreground mb-2 text-[11px] font-semibold tracking-wide uppercase">
            Saúde
          </p>
          <div className="flex flex-wrap gap-1.5">
            <Badge variant="secondary" className="text-[11px]">
              FIV: {formatTestResult(cat.fiv)}
            </Badge>
            <Badge variant="secondary" className="text-[11px]">
              FeLV: {formatTestResult(cat.felv)}
            </Badge>
            <HealthBooleanChip
              icon={Scissors}
              label="Castrado"
              value={cat.castrated}
            />
            <HealthBooleanChip
              icon={Syringe}
              label="Vacinado"
              value={cat.vaccinated}
            />
            <HealthBooleanChip
              icon={Bug}
              label="Vermifugado"
              value={cat.dewormed}
            />
          </div>

          {(cat.vaccinationNotes || cat.dewormingNotes) && (
            <p className="text-muted-foreground mt-2 text-xs leading-relaxed">
              {cat.vaccinationNotes && `Vacinação: ${cat.vaccinationNotes}`}
              {cat.vaccinationNotes && cat.dewormingNotes && ' • '}
              {cat.dewormingNotes && `Vermífugo: ${cat.dewormingNotes}`}
            </p>
          )}
        </div>

        <Button
          type="button"
          onClick={() => onAdoptClick(cat)}
          className="mt-auto w-full rounded-xl shadow-primary-glow hover:shadow-primary-glow-hover"
        >
          <Heart className="h-4 w-4" />
          Quero adotar
          <PawPrint className="h-4 w-4" />
        </Button>
      </CardContent>
    </Card>
  )
}
