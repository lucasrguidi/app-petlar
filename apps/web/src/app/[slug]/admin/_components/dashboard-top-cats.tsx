'use client'

import { Cat, Trophy } from 'lucide-react'
import { type Route } from 'next'
import Image from 'next/image'
import Link from 'next/link'

import { useIsCustomDomain } from '@/components/custom-domain-provider'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { useOrgSlug } from '@/hooks/use-org-slug'
import { buildOrgHref } from '@/lib/org-href'

interface TopCat {
  id: string
  name: string
  photoUrl: string | null
  applicationsCount: number
}

interface DashboardTopCatsProps {
  cats: TopCat[]
}

export function DashboardTopCats({ cats }: DashboardTopCatsProps) {
  const slug = useOrgSlug()
  const isCustomDomain = useIsCustomDomain()
  const orgHref = (path: string) =>
    buildOrgHref(path, slug, isCustomDomain) as Route

  return (
    <Card className="border-border/60 bg-card/95 shadow-warm-sm rounded-xl border">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-base font-semibold">
            <Trophy className="text-warning h-4 w-4" />
            Mais Procurados
          </CardTitle>
          <span className="text-muted-foreground text-xs">disponíveis</span>
        </div>
      </CardHeader>
      <CardContent>
        {cats.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-6 text-center">
            <div className="bg-muted/50 mb-2 flex h-10 w-10 items-center justify-center rounded-full">
              <Cat className="text-muted-foreground h-5 w-5" />
            </div>
            <p className="text-muted-foreground text-sm">
              Nenhuma candidatura ainda
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            {cats.map((cat, index) => (
              <Link
                key={cat.id}
                href={orgHref(`/admin/gatos/${cat.id}/interessados`)}
                className="hover:bg-muted/40 group flex items-center gap-3 rounded-lg p-2 transition-colors"
              >
                {/* Rank */}
                <span className="text-muted-foreground w-5 text-center text-sm font-semibold">
                  {index + 1}º
                </span>

                {/* Photo */}
                <div className="relative h-9 w-9 shrink-0 overflow-hidden rounded-full">
                  {cat.photoUrl ? (
                    <Image
                      src={cat.photoUrl}
                      alt={cat.name}
                      fill
                      className="object-cover"
                    />
                  ) : (
                    <div className="bg-muted flex h-full w-full items-center justify-center">
                      <Cat className="text-muted-foreground h-4 w-4" />
                    </div>
                  )}
                </div>

                {/* Name */}
                <span className="text-foreground group-hover:text-primary min-w-0 flex-1 truncate text-sm font-medium transition-colors">
                  {cat.name}
                </span>

                {/* Count */}
                <span className="text-muted-foreground shrink-0 text-xs tabular-nums">
                  {cat.applicationsCount}{' '}
                  {cat.applicationsCount === 1 ? 'candidatura' : 'candidaturas'}
                </span>
              </Link>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
