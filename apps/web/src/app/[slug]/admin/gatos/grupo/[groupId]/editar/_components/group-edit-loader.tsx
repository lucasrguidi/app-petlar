'use client'

import { useQuery } from '@tanstack/react-query'
import { AlertTriangle } from 'lucide-react'

import { CatFormSkeleton } from '../../../../_components/cat-form-skeleton'
import { GroupForm } from '../../../../novo-grupo/_components/group-form'

import { trpc } from '@/utils/trpc'

interface GroupEditLoaderProps {
  groupId: string
}

export function GroupEditLoader({ groupId }: GroupEditLoaderProps) {
  const { data, isLoading, isError } = useQuery(
    trpc.catGroups.getById.queryOptions({ id: groupId })
  )

  if (isLoading) {
    return <CatFormSkeleton />
  }

  if (isError || !data) {
    return (
      <div className="border-destructive/20 bg-destructive/5 rounded-xl border p-4 text-center">
        <p className="text-destructive inline-flex items-center gap-2 text-sm">
          <AlertTriangle className="h-4 w-4" />
          Grupo não encontrado.
        </p>
      </div>
    )
  }

  const existingCats = data.cats.map((cat) => ({
    id: cat.id,
    name: cat.name,
    sex: cat.sex as 'male' | 'female',
    photoUrl: cat.photos[0]?.url ?? null,
  }))

  const firstCat = data.cats[0]

  return (
    <GroupForm
      mode="edit"
      groupId={groupId}
      initialFormId={data.formId}
      initialExistingCats={existingCats}
      initialDonorName={firstCat?.donorName}
      initialDonorWhatsapp={firstCat?.donorWhatsapp}
      initialPhotos={data.photos}
    />
  )
}
