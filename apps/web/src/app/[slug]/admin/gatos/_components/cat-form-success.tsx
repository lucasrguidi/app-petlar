'use client'

import { Cat, CheckCircle2, List, Plus } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'

interface CatFormSuccessProps {
  onRegisterAnother: () => void
  onGoToList: () => void
}

export function CatFormSuccess({
  onRegisterAnother,
  onGoToList,
}: CatFormSuccessProps) {
  return (
    <Card className="border-border/60 bg-card/95 shadow-warm-lg mx-auto max-w-xl rounded-xl">
      <CardContent className="from-success/5 to-info/5 flex flex-col items-center rounded-xl bg-gradient-to-br px-6 py-10 text-center sm:px-10">
        <div className="bg-success/15 mb-5 flex h-16 w-16 items-center justify-center rounded-full shadow-sm">
          <Cat className="text-success h-8 w-8" />
        </div>

        <h2 className="text-display mb-2 text-xl font-semibold">
          Gato cadastrado com sucesso!
        </h2>

        <p className="text-muted-foreground mb-7 flex items-center gap-2 text-sm">
          <CheckCircle2 className="text-success h-4 w-4" />O gato foi adicionado
          à lista de disponíveis para adoção.
        </p>

        <div className="flex w-full flex-col gap-3 sm:flex-row sm:justify-center">
          <Button
            onClick={onRegisterAnother}
            className="shadow-primary-glow hover:shadow-primary-glow-hover gap-2 rounded-xl transition-all duration-200"
          >
            <Plus className="h-4 w-4" />
            Cadastrar outro
          </Button>

          <Button
            variant="outline"
            onClick={onGoToList}
            className="gap-2 rounded-xl"
          >
            <List className="h-4 w-4" />
            Ver lista
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
