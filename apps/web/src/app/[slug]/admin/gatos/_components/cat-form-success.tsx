'use client'

import { Cat, List, Plus } from 'lucide-react'

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
    <Card className="mx-auto max-w-md rounded-xl">
      <CardContent className="flex flex-col items-center py-12 text-center">
        <div className="mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-success/10">
          <Cat className="h-8 w-8 text-success" />
        </div>

        <h2 className="mb-2 text-xl font-semibold">
          Gato cadastrado com sucesso!
        </h2>

        <p className="mb-8 text-muted-foreground">
          O gato foi adicionado a lista de disponiveis para adocao.
        </p>

        <div className="flex w-full flex-col gap-3 sm:flex-row sm:justify-center">
          <Button onClick={onRegisterAnother} className="gap-2">
            <Plus className="h-4 w-4" />
            Cadastrar outro
          </Button>

          <Button variant="outline" onClick={onGoToList} className="gap-2">
            <List className="h-4 w-4" />
            Ver lista
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
