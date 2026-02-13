'use client'

import { FileText, Plus, Search } from 'lucide-react'
import Link from 'next/link'

import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { useOrgSlug } from '@/hooks/use-org-slug'

interface FormsEmptyStateProps {
  hasFilters: boolean
  onClearFilters: () => void
}

export function FormsEmptyState({
  hasFilters,
  onClearFilters,
}: FormsEmptyStateProps) {
  const slug = useOrgSlug()

  if (hasFilters) {
    return (
      <Card className="border-border/60 bg-card/95 shadow-warm-sm rounded-xl border">
        <CardContent className="flex flex-col items-center justify-center px-6 py-10 text-center">
          <div className="bg-muted/50 mb-4 rounded-full p-4">
            <Search className="text-muted-foreground h-8 w-8" />
          </div>
          <h3 className="text-foreground text-lg font-semibold">
            Nenhum formulário encontrado
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
          <FileText className="text-primary h-8 w-8" />
        </div>
        <h3 className="text-foreground text-lg font-semibold">
          Nenhum formulário criado
        </h3>
        <p className="text-muted-foreground mt-1 max-w-sm">
          Crie seu primeiro modelo para usar nas candidaturas dos gatos.
        </p>
        <Button asChild className="shadow-primary-glow mt-4 gap-2 rounded-xl">
          <Link href={`/${slug}/admin/formularios/novo`}>
            <Plus className="h-4 w-4" />
            Criar primeiro formulário
          </Link>
        </Button>
      </CardContent>
    </Card>
  )
}
