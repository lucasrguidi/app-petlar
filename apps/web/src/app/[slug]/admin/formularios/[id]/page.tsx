import { Suspense } from 'react'

import { FormsLoadingSkeleton } from '../_components/forms-loading-skeleton'

import { FormBuilderLoader } from './_components/form-builder-loader'

import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Editar Formulário',
}

interface EditarFormularioPageProps {
  params: Promise<{ id: string }>
}

export default async function EditarFormularioPage({
  params,
}: EditarFormularioPageProps) {
  const { id } = await params

  return (
    <div className="flex min-h-0 flex-1 flex-col overflow-y-auto">
      <div className="shrink-0 space-y-1 pb-4">
        <h1 className="text-display text-2xl font-bold tracking-tight">
          Editar formulário
        </h1>
        <p className="text-muted-foreground">
          Ajuste as perguntas que os candidatos vão responder.
        </p>
      </div>

      <Suspense fallback={<FormsLoadingSkeleton />}>
        <FormBuilderLoader formId={id} />
      </Suspense>
    </div>
  )
}
