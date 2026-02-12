import { Cat, Mars, Sparkles, Venus } from 'lucide-react'

import { cn } from '@/lib/utils'

export interface ApplicationSheetCatSummary {
  id: string
  name: string
  sex: 'male' | 'female'
  ageYears: number | null
  ageMonths: number | null
  photoUrl: string | null
}

interface ApplicationSheetHeaderProps {
  cat: ApplicationSheetCatSummary
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

export function ApplicationSheetHeader({ cat }: ApplicationSheetHeaderProps) {
  return (
    <div
      className={cn(
        'rounded-2xl border border-[#AEC7E2]/40 p-4',
        'bg-gradient-to-br from-white via-white to-[#AEC7E2]/20'
      )}
    >
      <div className="flex items-start gap-3">
        <div className="h-16 w-16 shrink-0 overflow-hidden rounded-2xl bg-[#AEC7E2]/25">
          {cat.photoUrl ? (
            <img
              src={cat.photoUrl}
              alt={`Foto de ${cat.name}`}
              className="h-full w-full object-cover"
              loading="lazy"
            />
          ) : (
            <div className="flex h-full items-center justify-center text-[#8B5A2B]/45">
              <Cat className="h-7 w-7" />
            </div>
          )}
        </div>

        <div className="min-w-0 flex-1 space-y-2">
          <div className="flex flex-wrap items-center gap-2">
            <h3
              className="truncate text-xl font-bold text-[#783201]"
              style={{ fontFamily: 'var(--font-display)' }}
            >
              {cat.name}
            </h3>
            <span
              className={cn(
                'inline-flex items-center gap-1 rounded-full px-2.5 py-1',
                'bg-emerald-500/90 text-xs font-semibold text-white'
              )}
            >
              <Sparkles className="h-3 w-3" />
              Disponível
            </span>
          </div>

          <div className="flex flex-wrap items-center gap-2 text-sm text-[#8B5A2B]/80">
            <span
              className={cn(
                'inline-flex items-center gap-1 rounded-full px-2 py-1',
                cat.sex === 'male'
                  ? 'bg-blue-500/10 text-blue-700'
                  : 'bg-pink-500/10 text-pink-700'
              )}
            >
              {cat.sex === 'male' ? (
                <Mars className="h-3.5 w-3.5" />
              ) : (
                <Venus className="h-3.5 w-3.5" />
              )}
              {cat.sex === 'male' ? 'Macho' : 'Fêmea'}
            </span>
            <span className="text-[#8B5A2B]/60">•</span>
            <span>{formatAge(cat.ageYears, cat.ageMonths)}</span>
          </div>
        </div>
      </div>
    </div>
  )
}
