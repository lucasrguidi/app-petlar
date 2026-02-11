import { Cat, Plus } from 'lucide-react'
import Link from 'next/link'
import { Suspense } from 'react'

import { CatsLoadingSkeleton } from './_components/cats-loading-skeleton'
import { CatsPageContent } from './_components/cats-page-content'

import { Button } from '@/components/ui/button'

interface GatosPageProps {
  params: Promise<{ slug: string }>
  searchParams: Promise<{
    status?: string
    sex?: string
    fiv?: string
    felv?: string
    castrated?: string
    search?: string
    page?: string
  }>
}

export default async function GatosPage({
  params,
  searchParams,
}: GatosPageProps) {
  const { slug } = await params
  const filters = await searchParams

  return (
    <div className="mx-auto flex h-full w-full max-w-6xl flex-col">
      <div className="flex shrink-0 flex-col gap-4 pb-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="space-y-1">
          <h1 className="text-display flex items-center gap-2 text-2xl font-bold tracking-tight">
            <Cat className="text-primary h-6 w-6" />
            Gatos
          </h1>
          <p className="text-muted-foreground">
            Gerencie os gatos disponíveis para adoção
          </p>
        </div>
        <Button
          asChild
          className="shadow-primary-glow hover:shadow-primary-glow-hover hidden gap-2 rounded-xl sm:flex"
        >
          <Link href={`/${slug}/admin/gatos/novo`}>
            <Plus className="h-4 w-4" />
            Novo Gato
          </Link>
        </Button>
      </div>

      <Suspense fallback={<CatsLoadingSkeleton />}>
        <CatsPageContent searchParams={filters} />
      </Suspense>

      <Link
        href={`/${slug}/admin/gatos/novo`}
        className="bg-primary text-primary-foreground shadow-primary-glow fixed right-6 bottom-6 z-50 flex h-14 w-14 items-center justify-center rounded-xl transition-transform hover:scale-105 active:scale-95 sm:hidden"
      >
        <Plus className="h-6 w-6" />
      </Link>
    </div>
  )
}
