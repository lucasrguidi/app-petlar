import { Cat, Plus, Search } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'

interface CatsEmptyStateProps {
  hasFilters: boolean
  orgSlug: string
  onClearFilters: () => void
}

export function CatsEmptyState({
  hasFilters,
  orgSlug,
  onClearFilters,
}: CatsEmptyStateProps) {
  if (hasFilters) {
    return (
      <Card className="rounded-xl border-0 shadow-sm">
        <CardContent className="flex flex-col items-center justify-center py-12 text-center">
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
            className="mt-4 rounded-lg"
            onClick={onClearFilters}
          >
            Limpar filtros
          </Button>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="rounded-xl border-0 shadow-sm">
      <CardContent className="flex flex-col items-center justify-center py-12 text-center">
        <div className="bg-primary/10 mb-4 rounded-full p-4">
          <Cat className="text-primary h-8 w-8" />
        </div>
        <h3 className="text-foreground text-lg font-semibold">
          Nenhum gato cadastrado
        </h3>
        <p className="text-muted-foreground mt-1 max-w-sm">
          Comece cadastrando o primeiro gato disponível para adoção.
        </p>
        <Button asChild className="mt-4 gap-2 rounded-lg">
          <a href={`/${orgSlug}/admin/gatos/novo`}>
            <Plus className="h-4 w-4" />
            Cadastrar primeiro gato
          </a>
        </Button>
      </CardContent>
    </Card>
  )
}
