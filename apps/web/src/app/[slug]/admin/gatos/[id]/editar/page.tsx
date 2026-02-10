import { Suspense } from 'react'

import { CatFormSkeleton } from '../../_components/cat-form-skeleton'

import { CatFormLoader } from './_components/cat-form-loader'

import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Editar Gato',
}

interface EditarGatoPageProps {
  params: Promise<{ id: string }>
}

export default async function EditarGatoPage({ params }: EditarGatoPageProps) {
  const { id } = await params

  return (
    <div className="flex min-h-0 flex-1 flex-col overflow-y-auto">
      {/* Header */}
      <div className="shrink-0 space-y-1 pb-4">
        <h1 className="text-display text-2xl font-bold tracking-tight">
          Editar Gato
        </h1>
        <p className="text-muted-foreground">
          Atualize as informações do gato
        </p>
      </div>

      {/* Form with loader */}
      <Suspense fallback={<CatFormSkeleton />}>
        <CatFormLoader catId={id} />
      </Suspense>
    </div>
  )
}
