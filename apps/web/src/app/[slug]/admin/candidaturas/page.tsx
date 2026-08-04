import { ClipboardList } from 'lucide-react'
import { Suspense } from 'react'

import { CandidaturasLoadingSkeleton } from './_components/candidaturas-loading-skeleton'
import { CandidaturasPageContent } from './_components/candidaturas-page-content'

import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Candidaturas',
}

interface CandidaturasPageProps {
  searchParams: Promise<{
    status?: string
    search?: string
    page?: string
  }>
}

export default async function CandidaturasPage({
  searchParams,
}: CandidaturasPageProps) {
  const filters = await searchParams

  return (
    <div className="mx-auto flex h-full w-full max-w-6xl flex-col">
      <div className="shrink-0 space-y-1 pb-4">
        <h1 className="text-display flex items-center gap-2 text-2xl font-bold tracking-tight">
          <ClipboardList className="text-primary h-6 w-6" />
          Candidaturas
        </h1>
        <p className="text-muted-foreground">
          Acompanhe todas as candidaturas confirmadas da organização.
        </p>
      </div>

      <Suspense fallback={<CandidaturasLoadingSkeleton />}>
        <CandidaturasPageContent searchParams={filters} />
      </Suspense>
    </div>
  )
}
