import { Suspense } from 'react'

import { CatFormSkeleton } from '../../../_components/cat-form-skeleton'

import { GroupEditLoader } from './_components/group-edit-loader'

import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Editar Grupo',
}

interface EditGroupPageProps {
  params: Promise<{ groupId: string }>
}

export default async function EditGroupPage({ params }: EditGroupPageProps) {
  const { groupId } = await params

  return (
    <div className="flex min-h-0 flex-1 flex-col overflow-y-auto">
      <div className="shrink-0 space-y-1 pb-4">
        <h1 className="text-display text-2xl font-bold tracking-tight">
          Editar Grupo
        </h1>
        <p className="text-muted-foreground">
          Gerencie os gatos e configurações do grupo
        </p>
      </div>

      <Suspense fallback={<CatFormSkeleton />}>
        <GroupEditLoader groupId={groupId} />
      </Suspense>
    </div>
  )
}
