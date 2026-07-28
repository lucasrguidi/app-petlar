import { Users } from 'lucide-react'
import { Suspense } from 'react'

import { ApplicantsLoadingSkeleton } from '../../../[id]/interessados/_components/applicants-loading-skeleton'

import { GroupApplicantsContent } from './_components/group-applicants-content'

import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Interessados do Grupo',
}

interface GroupInteressadosPageProps {
  params: Promise<{ groupId: string }>
  searchParams: Promise<{
    status?: string
    search?: string
    page?: string
  }>
}

export default async function GroupInteressadosPage({
  params,
  searchParams,
}: GroupInteressadosPageProps) {
  const { groupId } = await params
  const filters = await searchParams

  return (
    <div className="mx-auto flex h-full w-full max-w-6xl flex-col">
      <div className="shrink-0 space-y-1 pb-4">
        <h1 className="text-display flex items-center gap-2 text-2xl font-bold tracking-tight">
          <Users className="text-primary h-6 w-6" />
          Interessados do Grupo
        </h1>
        <p className="text-muted-foreground">
          Acompanhe as candidaturas confirmadas deste grupo.
        </p>
      </div>

      <Suspense fallback={<ApplicantsLoadingSkeleton />}>
        <GroupApplicantsContent groupId={groupId} searchParams={filters} />
      </Suspense>
    </div>
  )
}
