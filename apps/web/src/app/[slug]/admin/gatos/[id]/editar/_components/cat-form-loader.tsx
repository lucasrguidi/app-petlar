'use client'

import { useQuery } from '@tanstack/react-query'
import { AlertCircle } from 'lucide-react'

import { CatForm } from '../../../_components/cat-form'
import { CatFormSkeleton } from '../../../_components/cat-form-skeleton'

import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { trpc } from '@/utils/trpc'

interface CatFormLoaderProps {
  catId: string
}

export function CatFormLoader({ catId }: CatFormLoaderProps) {
  const { data, isLoading, isError, error, refetch } = useQuery(
    trpc.cats.getById.queryOptions({ id: catId })
  )

  if (isLoading) {
    return <CatFormSkeleton />
  }

  if (isError) {
    return (
      <Card className="rounded-xl">
        <CardContent className="flex flex-col items-center justify-center gap-4 py-12">
          <AlertCircle className="text-destructive h-12 w-12" />
          <div className="text-center">
            <p className="font-medium">Erro ao carregar dados do gato</p>
            <p className="text-muted-foreground text-sm">
              {error?.message || 'Tente novamente mais tarde'}
            </p>
          </div>
          <Button onClick={() => refetch()} variant="outline">
            Tentar novamente
          </Button>
        </CardContent>
      </Card>
    )
  }

  if (!data) {
    return (
      <Card className="rounded-xl">
        <CardContent className="flex flex-col items-center justify-center gap-4 py-12">
          <AlertCircle className="text-muted-foreground h-12 w-12" />
          <p className="text-muted-foreground">Gato não encontrado</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <CatForm
      mode="edit"
      catId={catId}
      initialData={{
        name: data.name,
        ageYears: data.ageYears,
        ageMonths: data.ageMonths,
        sex: data.sex,
        fiv: data.fiv,
        felv: data.felv,
        castrated: data.castrated,
        vaccinated: data.vaccinated,
        vaccinationNotes: data.vaccinationNotes,
        dewormed: data.dewormed,
        dewormingNotes: data.dewormingNotes,
        description: data.description,
        formId: data.formId ?? '',
        photos: data.photos,
      }}
    />
  )
}
