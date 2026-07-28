import { GroupForm } from './_components/group-form'

import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Novo Grupo',
}

export default function NovoGrupoPage() {
  return (
    <div className="flex min-h-0 flex-1 flex-col overflow-y-auto">
      <div className="shrink-0 space-y-1 pb-4">
        <h1 className="text-display text-2xl font-bold tracking-tight">
          Novo Grupo
        </h1>
        <p className="text-muted-foreground">
          Cadastre um grupo de gatos para adoção conjunta
        </p>
      </div>

      <GroupForm mode="create" />
    </div>
  )
}
