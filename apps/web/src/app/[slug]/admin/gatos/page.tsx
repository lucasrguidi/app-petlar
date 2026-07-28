import { Cat, Plus, Users } from 'lucide-react'
import { type Route } from 'next'
import Link from 'next/link'
import { Suspense } from 'react'

import { CatsLoadingSkeleton } from './_components/cats-loading-skeleton'
import { CatsPageContent } from './_components/cats-page-content'

import { Button } from '@/components/ui/button'
import { getIsCustomDomain } from '@/lib/get-is-custom-domain'
import { buildOrgHref } from '@/lib/org-href'

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
  const [{ slug }, filters, isCustomDomain] = await Promise.all([
    params,
    searchParams,
    getIsCustomDomain(),
  ])

  const orgHref = (path: string) =>
    buildOrgHref(path, slug, isCustomDomain) as Route

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
        <div className="hidden gap-2 sm:flex">
          <Button
            asChild
            variant="secondary"
            className="gap-2 rounded-xl"
          >
            <Link href={orgHref('/admin/gatos/novo-grupo')}>
              <Users className="h-4 w-4" />
              Novo Grupo
            </Link>
          </Button>
          <Button
            asChild
            className="shadow-primary-glow hover:shadow-primary-glow-hover gap-2 rounded-xl"
          >
            <Link href={orgHref('/admin/gatos/novo')}>
              <Plus className="h-4 w-4" />
              Novo Gato
            </Link>
          </Button>
        </div>
      </div>

      <Suspense fallback={<CatsLoadingSkeleton />}>
        <CatsPageContent searchParams={filters} />
      </Suspense>

      <div className="fixed right-6 bottom-6 z-50 flex flex-col items-end gap-2 sm:hidden">
        <Link
          href={orgHref('/admin/gatos/novo-grupo')}
          className="bg-primary/10 text-primary border-primary/20 flex h-11 w-11 items-center justify-center rounded-full border shadow-md transition-transform hover:scale-105 active:scale-95"
          aria-label="Novo Grupo"
        >
          <Users className="h-4.5 w-4.5" />
        </Link>
        <Link
          href={orgHref('/admin/gatos/novo')}
          className="bg-primary text-primary-foreground shadow-primary-glow flex h-14 w-14 items-center justify-center rounded-full transition-transform hover:scale-105 active:scale-95"
          aria-label="Novo Gato"
        >
          <Plus className="h-6 w-6" />
        </Link>
      </div>
    </div>
  )
}
