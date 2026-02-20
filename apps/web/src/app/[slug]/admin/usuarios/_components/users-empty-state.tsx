'use client'

import { Search, Users } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'

interface UsersEmptyStateProps {
  hasFilters: boolean
  onClearFilters: () => void
}

export function UsersEmptyState({
  hasFilters,
  onClearFilters,
}: UsersEmptyStateProps) {
  if (hasFilters) {
    return (
      <Card className="border-border/60 bg-card/95 shadow-warm-sm rounded-xl border">
        <CardContent className="flex flex-col items-center justify-center px-6 py-10 text-center">
          <div className="bg-muted/50 mb-4 rounded-full p-4">
            <Search className="text-muted-foreground h-8 w-8" />
          </div>
          <h3 className="text-foreground text-lg font-semibold">
            Nenhum usuário encontrado
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
          <Users className="text-primary h-8 w-8" />
        </div>
        <h3 className="text-foreground text-lg font-semibold">
          Nenhum membro na equipe
        </h3>
        <p className="text-muted-foreground mt-1 max-w-sm">
          Convide pessoas para fazer parte da sua equipe.
        </p>
      </CardContent>
    </Card>
  )
}
