'use client'

import { useQuery } from '@tanstack/react-query'

import { useOrgSlug } from '@/hooks/use-org-slug'
import { cn } from '@/lib/utils'
import { trpc } from '@/utils/trpc'

export function SponsorsSection() {
  const slug = useOrgSlug()

  const { data: sponsors = [] } = useQuery(
    trpc.sponsors.listPublic.queryOptions({ slug })
  )

  if (sponsors.length === 0) return null

  const featured = sponsors.filter((s) => s.featured)
  const regular = sponsors.filter((s) => !s.featured)

  return (
    <section
      id="patrocinadores"
      className="relative px-4 py-16 sm:px-6 lg:px-8 lg:py-24"
    >
      {/* Background */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute inset-0 bg-white/20" />
        <div className="absolute top-1/2 left-1/2 h-[500px] w-[500px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-white/25 blur-3xl" />
      </div>

      <div className="relative mx-auto w-full max-w-6xl">
        {/* Header */}
        <div className="mb-12 text-center">
          <h2
            className="mb-3 text-3xl font-bold tracking-tight text-foreground sm:text-4xl"
            style={{ fontFamily: 'var(--font-display)' }}
          >
            Nossos Patrocinadores
          </h2>
          <p className="mx-auto max-w-xl text-foreground/70">
            Agradecemos o apoio de quem torna nosso trabalho possível
          </p>
        </div>

        {/* Featured sponsors */}
        {featured.length > 0 && (
          <div className="mb-8 flex flex-wrap items-center justify-center gap-6">
            {featured.map((sponsor) => (
              <a
                key={sponsor.id}
                href={sponsor.websiteUrl}
                target="_blank"
                rel="noopener noreferrer"
                className={cn(
                  'group flex flex-col items-center justify-center gap-3',
                  'rounded-2xl bg-white/80 backdrop-blur-sm',
                  'border border-white/50',
                  'px-8 py-6',
                  'shadow-lg shadow-foreground/5',
                  'transition-all duration-300',
                  'hover:-translate-y-1 hover:shadow-xl hover:shadow-primary/10'
                )}
              >
                <img
                  src={sponsor.logoUrl}
                  alt={sponsor.name}
                  className="h-24 max-w-[280px] object-contain grayscale transition-all duration-300 group-hover:grayscale-0 sm:h-32"
                />
                <span className="text-sm font-medium text-foreground/70 transition-colors duration-300 group-hover:text-foreground">
                  {sponsor.name}
                </span>
              </a>
            ))}
          </div>
        )}

        {/* Regular sponsors */}
        {regular.length > 0 && (
          <div className="flex flex-wrap items-center justify-center gap-4">
            {regular.map((sponsor) => (
              <a
                key={sponsor.id}
                href={sponsor.websiteUrl}
                target="_blank"
                rel="noopener noreferrer"
                className={cn(
                  'group flex flex-col items-center justify-center gap-2',
                  'rounded-xl bg-white/60 backdrop-blur-sm',
                  'border border-white/40',
                  'px-5 py-4',
                  'shadow-md shadow-foreground/5',
                  'transition-all duration-300',
                  'hover:-translate-y-0.5 hover:shadow-lg hover:shadow-primary/10'
                )}
              >
                <img
                  src={sponsor.logoUrl}
                  alt={sponsor.name}
                  className="h-16 max-w-[200px] object-contain grayscale transition-all duration-300 group-hover:grayscale-0 sm:h-20"
                />
                <span className="text-xs font-medium text-foreground/60 transition-colors duration-300 group-hover:text-foreground/80">
                  {sponsor.name}
                </span>
              </a>
            ))}
          </div>
        )}
      </div>
    </section>
  )
}
