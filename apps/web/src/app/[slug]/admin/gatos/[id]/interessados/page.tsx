import { Users } from 'lucide-react'
import { Suspense } from 'react'

import { ApplicantsLoadingSkeleton } from './_components/applicants-loading-skeleton'
import { ApplicantsPageContent } from './_components/applicants-page-content'

import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Interessados',
}

interface InteressadosPageProps {
  params: Promise<{ id: string }>
  searchParams: Promise<{
    status?: string
    search?: string
    page?: string
    dynamicFilters?: string
  }>
}

export default async function InteressadosPage({
  params,
  searchParams,
}: InteressadosPageProps) {
  const { id } = await params
  const filters = await searchParams

  return (
    <div className="mx-auto flex h-full w-full max-w-6xl flex-col">
      <div className="shrink-0 space-y-1 pb-4">
        <h1 className="text-display flex items-center gap-2 text-2xl font-bold tracking-tight">
          <Users className="text-primary h-6 w-6" />
          Interessados
        </h1>
        <p className="text-muted-foreground">
          Acompanhe as candidaturas confirmadas deste gato.
        </p>
      </div>

      <Suspense fallback={<ApplicantsLoadingSkeleton />}>
        <ApplicantsPageContent catId={id} searchParams={filters} />
      </Suspense>
    </div>
  )
}
