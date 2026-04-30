'use client'

import { Cat, Plus, Search } from 'lucide-react'
import Link from 'next/link'

import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { useOrgHref } from '@/hooks/use-org-href'

interface CatsEmptyStateProps {
  hasFilters: boolean
  onClearFilters: () => void
}

export function CatsEmptyState({
  hasFilters,
  onClearFilters,
}: CatsEmptyStateProps) {
  const newCatHref = useOrgHref('/admin/gatos/novo')
  if (hasFilters) {
    return (
      <Card className="border-border/60 bg-card/95 shadow-warm-sm rounded-xl border">
        <CardContent className="flex flex-col items-center justify-center px-6 py-10 text-center">
          <div className="bg-muted/50 mb-4 rounded-full p-4">
            <Search className="text-muted-foreground h-8 w-8" />
          </div>
          <h3 className="text-foreground text-lg font-semibold">
            Nenhum gato encontrado
          </h3>
          <p className="text-muted-foreground mt-1 max-w-sm">
            Tente ajustar os filtros ou limpar a busca para ver mais resultados.
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
          <Cat className="text-primary h-8 w-8" />
        </div>
        <h3 className="text-foreground text-lg font-semibold">
          Nenhum gato cadastrado
        </h3>
        <p className="text-muted-foreground mt-1 max-w-sm">
          Comece cadastrando o primeiro gato disponível para adoção.
        </p>
        <Button asChild className="shadow-primary-glow mt-4 gap-2 rounded-xl">
          <Link href={newCatHref}>
            <Plus className="h-4 w-4" />
            Cadastrar primeiro gato
          </Link>
        </Button>
      </CardContent>
    </Card>
  )
}
