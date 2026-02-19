import { Heart } from 'lucide-react'
import { Suspense } from 'react'

import { AdoptionsLoadingSkeleton } from './_components/adoptions-loading-skeleton'
import { AdoptionsPageContent } from './_components/adoptions-page-content'

interface AdotadosPageProps {
  params: Promise<{ slug: string }>
  searchParams: Promise<{
    search?: string
    dateFrom?: string
    dateTo?: string
    page?: string
  }>
}

export default async function AdotadosPage({
  params: _params,
  searchParams,
}: AdotadosPageProps) {
  const filters = await searchParams

  return (
    <div className="mx-auto flex h-full w-full max-w-6xl flex-col">
      <div className="flex shrink-0 flex-col gap-4 pb-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="space-y-1">
          <h1 className="text-display flex items-center gap-2 text-2xl font-bold tracking-tight">
            <Heart className="text-primary h-6 w-6" />
            Gatos Adotados
          </h1>
          <p className="text-muted-foreground">
            Histórico de adoções realizadas
          </p>
        </div>
      </div>

      <Suspense fallback={<AdoptionsLoadingSkeleton />}>
        <AdoptionsPageContent searchParams={filters} />
      </Suspense>
    </div>
  )
}
