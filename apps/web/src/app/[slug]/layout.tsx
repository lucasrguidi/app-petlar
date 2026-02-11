import { notFound } from 'next/navigation'

import { getOrgBySlug } from './_lib/get-org-by-slug'

interface OrgLayoutProps {
  children: React.ReactNode
  params: Promise<{ slug: string }>
}

export default async function OrgLayout({ children, params }: OrgLayoutProps) {
  const { slug } = await params
  const org = await getOrgBySlug(slug)

  if (!org) {
    notFound()
  }

  return <>{children}</>
}
