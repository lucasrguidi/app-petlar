'use client'

import { ClipboardList, FilterX, Search } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'

interface CandidaturasEmptyStateProps {
  hasFilters: boolean
  onClearFilters: () => void
}

export function CandidaturasEmptyState({
  hasFilters,
  onClearFilters,
}: CandidaturasEmptyStateProps) {
  if (hasFilters) {
    return (
      <Card className="border-border/60 bg-card/95 shadow-warm-sm rounded-xl border">
        <CardContent className="flex flex-col items-center justify-center px-6 py-10 text-center">
          <div className="bg-muted/50 mb-4 rounded-full p-4">
            <Search className="text-muted-foreground h-8 w-8" />
          </div>
          <h3 className="text-foreground text-lg font-semibold">
            Nenhuma candidatura encontrada
          </h3>
          <p className="text-muted-foreground mt-1 max-w-sm">
            Ajuste os filtros para encontrar outras candidaturas.
          </p>
          <Button
            variant="outline"
            className="mt-4 gap-2 rounded-xl"
            onClick={onClearFilters}
          >
            <FilterX className="h-4 w-4" />
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
          <ClipboardList className="text-primary h-8 w-8" />
        </div>
        <h3 className="text-foreground text-lg font-semibold">
          Ainda não há candidaturas confirmadas
        </h3>
        <p className="text-muted-foreground mt-1 max-w-sm">
          Quando alguém confirmar uma candidatura por e-mail, ela aparecerá
          aqui.
        </p>
      </CardContent>
    </Card>
  )
}
