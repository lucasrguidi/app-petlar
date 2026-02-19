import { CatForm } from '../_components/cat-form'

import type { CatFormData } from '../_components/cat-form-schema'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Novo Gato',
}

interface NovoGatoPageProps {
  searchParams: Promise<{ prefill?: string }>
}

export default async function NovoGatoPage({
  searchParams,
}: NovoGatoPageProps) {
  const { prefill } = await searchParams

  let initialData: Partial<CatFormData> | undefined = undefined
  if (prefill) {
    try {
      initialData = JSON.parse(atob(prefill))
    } catch {
      // Invalid prefill data, ignore
    }
  }

  return (
    <div className="flex min-h-0 flex-1 flex-col overflow-y-auto">
      {/* Header */}
      <div className="shrink-0 space-y-1 pb-4">
        <h1 className="text-display text-2xl font-bold tracking-tight">
          Novo Gato
        </h1>
        <p className="text-muted-foreground">
          Cadastre um novo gato para adoção
        </p>
      </div>

      {/* Form */}
      <CatForm mode="create" initialData={initialData} />
    </div>
  )
}
