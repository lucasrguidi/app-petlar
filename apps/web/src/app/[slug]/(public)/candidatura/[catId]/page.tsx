import { ArrowLeft } from 'lucide-react'
import { type Route } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'

import { getOrgBySlug } from '../../../_lib/get-org-by-slug'

import { ApplicationPage } from './_components/application-page'

import { getIsCustomDomain } from '@/lib/get-is-custom-domain'
import { buildOrgHref } from '@/lib/org-href'



interface CandidaturaPageProps {
  params: Promise<{ slug: string; catId: string }>
}

export default async function CandidaturaPage({
  params,
}: CandidaturaPageProps) {
  const { slug, catId } = await params

  const [org, isCustomDomain] = await Promise.all([
    getOrgBySlug(slug),
    getIsCustomDomain(),
  ])
  if (!org) {
    notFound()
  }

  const homeHref = buildOrgHref('', slug, isCustomDomain) as Route

  return (
    <div className="min-h-screen px-4 py-6 sm:px-6 lg:px-8 lg:py-10">
      <div className="mx-auto w-full max-w-5xl space-y-6">
        {/* Back navigation */}
        <Link
          href={homeHref}
          className="group inline-flex items-center gap-2 rounded-xl px-3 py-2 text-sm font-medium text-foreground/80 transition-all hover:bg-white/50 hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4 transition-transform group-hover:-translate-x-0.5" />
          Voltar aos gatos
        </Link>

        {/* Main content */}
        <ApplicationPage slug={slug} catId={catId} />
      </div>
    </div>
  )
}
