'use client'

import { useQuery } from '@tanstack/react-query'
import { AlertCircle } from 'lucide-react'

import { FormBuilder } from '../../_components/form-builder'
import { FormsLoadingSkeleton } from '../../_components/forms-loading-skeleton'

import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { trpc } from '@/utils/trpc'

interface FormBuilderLoaderProps {
  formId: string
}

export function FormBuilderLoader({ formId }: FormBuilderLoaderProps) {
  const { data, isLoading, isError, error, refetch } = useQuery(
    trpc.forms.getById.queryOptions({ id: formId })
  )

  if (isLoading) {
    return <FormsLoadingSkeleton />
  }

  if (isError) {
    return (
      <Card className="rounded-xl">
        <CardContent className="flex flex-col items-center justify-center gap-4 py-12">
          <AlertCircle className="h-12 w-12 text-destructive" />
          <div className="text-center">
            <p className="font-medium">Erro ao carregar formulário</p>
            <p className="text-sm text-muted-foreground">
              {error?.message || 'Tente novamente em instantes'}
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
          <AlertCircle className="h-12 w-12 text-muted-foreground" />
          <p className="text-muted-foreground">Formulário não encontrado</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <FormBuilder
      mode="edit"
      formId={formId}
      initialData={{
        name: data.name,
        description: data.description,
        active: data.active,
        linkedCatsCount: data.linkedCatsCount,
        fields: data.fields.map((field) => ({
          id: field.id,
          type: field.type,
          label: field.label,
          required: field.required,
          helpText: field.helpText,
          options: field.options,
          mediaConfig: field.mediaConfig,
          condition: field.condition,
          order: field.order,
        })),
      }}
    />
  )
}
