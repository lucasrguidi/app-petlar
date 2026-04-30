import { auth } from '@app-petlar/auth'
import { Settings } from 'lucide-react'
import { type Route } from 'next'
import { headers } from 'next/headers'
import { redirect } from 'next/navigation'
import { Suspense } from 'react'

import { SettingsLoadingSkeleton } from './_components/settings-loading-skeleton'
import { SettingsPageContent } from './_components/settings-page-content'

import { getIsCustomDomain } from '@/lib/get-is-custom-domain'
import { buildOrgHref } from '@/lib/org-href'

interface ConfiguracoesPageProps {
  params: Promise<{ slug: string }>
}

export default async function ConfiguracoesPage({
  params,
}: ConfiguracoesPageProps) {
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
      <div className="flex shrink-0 flex-col gap-4 pb-6">
        <div className="space-y-1">
          <h1 className="text-display flex items-center gap-2 text-2xl font-bold tracking-tight">
            <Settings className="text-primary h-6 w-6" />
            Configurações
          </h1>
          <p className="text-muted-foreground">
            Personalize o domínio e as cores do seu site de adoção
          </p>
        </div>
      </div>

      <Suspense fallback={<SettingsLoadingSkeleton />}>
        <SettingsPageContent />
      </Suspense>
    </div>
  )
}
