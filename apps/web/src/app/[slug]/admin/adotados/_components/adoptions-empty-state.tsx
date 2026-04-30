'use client'

import { Heart, Search } from 'lucide-react'
import Link from 'next/link'

import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { useOrgHref } from '@/hooks/use-org-href'

interface AdoptionsEmptyStateProps {
  hasFilters: boolean
  onClearFilters: () => void
}

export function AdoptionsEmptyState({
  hasFilters,
  onClearFilters,
}: AdoptionsEmptyStateProps) {
  const catsHref = useOrgHref('/admin/gatos')

  if (hasFilters) {
    return (
      <Card className="border-border/60 bg-card/95 shadow-warm-sm rounded-xl border">
        <CardContent className="flex flex-col items-center justify-center px-6 py-10 text-center">
          <div className="bg-muted/50 mb-4 rounded-full p-4">
            <Search className="text-muted-foreground h-8 w-8" />
          </div>
          <h3 className="text-foreground text-lg font-semibold">
            Nenhuma adoção encontrada
          </h3>
          <p className="text-muted-foreground mt-1 max-w-sm">
            Tente ajustar os filtros ou período para ver mais resultados.
          </p>
          <Button
            variant="outline"
            className="mt-4 rounded-xl"
            onClick={onClearFilters}
          >
            Limpar filtros
          </Button>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="border-border/60 bg-card/95 shadow-warm-sm rounded-xl border">
      <CardContent className="flex flex-col items-center justify-center px-6 py-10 text-center">
        <div className="bg-primary/10 mb-4 rounded-full p-4">
          <Heart className="text-primary h-8 w-8" />
        </div>
        <h3 className="text-foreground text-lg font-semibold">
          Nenhuma adoção registrada
        </h3>
        <p className="text-muted-foreground mt-1 max-w-sm">
          Quando você marcar um gato como adotado, ele aparecerá aqui.
        </p>
        <Button asChild className="shadow-primary-glow mt-4 gap-2 rounded-xl">
          <Link href={catsHref}>Ver gatos disponíveis</Link>
        </Button>
      </CardContent>
    </Card>
  )
}
