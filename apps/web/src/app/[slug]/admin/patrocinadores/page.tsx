import { auth } from '@app-petlar/auth'
import { Handshake } from 'lucide-react'
import { type Route } from 'next'
import { headers } from 'next/headers'
import { redirect } from 'next/navigation'
import { Suspense } from 'react'

import { SponsorsLoadingSkeleton } from './_components/sponsors-loading-skeleton'
import { SponsorsPageContent } from './_components/sponsors-page-content'

import { getIsCustomDomain } from '@/lib/get-is-custom-domain'
import { buildOrgHref } from '@/lib/org-href'

interface PatrocinadoresPageProps {
  params: Promise<{ slug: string }>
}

export default async function PatrocinadoresPage({
  params,
}: PatrocinadoresPageProps) {
  const [{ slug }, session, isCustomDomain] = await Promise.all([
    params,
    auth.api.getSession({ headers: await headers() }),
    getIsCustomDomain(),
  ])

  if (!session || session.user.role !== 'admin') {
    redirect(buildOrgHref('/admin', slug, isCustomDomain) as Route)
  }

  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col pb-8">
      <div className="flex shrink-0 flex-col gap-4 pb-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="space-y-1">
          <h1 className="text-display flex items-center gap-2 text-2xl font-bold tracking-tight">
            <Handshake className="text-primary h-6 w-6" />
            Patrocinadores
          </h1>
          <p className="text-muted-foreground">
            Gerencie os logos e links dos patrocinadores que aparecem no seu site
          </p>
        </div>
      </div>

      <Suspense fallback={<SponsorsLoadingSkeleton />}>
        <SponsorsPageContent />
      </Suspense>
    </div>
  )
}
