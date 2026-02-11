import { FormBuilder } from '../_components/form-builder'

import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Novo Formulário',
}

export default function NovoFormularioPage() {
  return (
    <div className="flex min-h-0 flex-1 flex-col overflow-y-auto">
      <div className="shrink-0 space-y-1 pb-4">
        <h1 className="text-display text-2xl font-bold tracking-tight">
          Novo formulário
        </h1>
        <p className="text-muted-foreground">
          Template selecionado: Começar do zero
        </p>
      </div>

      <FormBuilder mode="create" />
    </div>
  )
}
