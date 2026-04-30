import { notFound } from 'next/navigation'

import { generateOrgThemeCSS } from './_lib/generate-theme-css'
import { getOrgBySlug } from './_lib/get-org-by-slug'

import { CustomDomainProvider } from '@/components/custom-domain-provider'
import { getIsCustomDomain } from '@/lib/get-is-custom-domain'


interface OrgLayoutProps {
  children: React.ReactNode
  params: Promise<{ slug: string }>
}

// Prevent static caching to ensure fresh theme data
export const dynamic = 'force-dynamic'

export default async function OrgLayout({ children, params }: OrgLayoutProps) {
  const { slug } = await params
  const [org, isCustomDomain] = await Promise.all([
    getOrgBySlug(slug),
    getIsCustomDomain(),
  ])

  if (!org) {
    notFound()
  }

  const themeCSS = generateOrgThemeCSS(org)

  return (
    <CustomDomainProvider isCustomDomain={isCustomDomain}>
      <style dangerouslySetInnerHTML={{ __html: themeCSS }} />
      {children}
    </CustomDomainProvider>
  )
}
