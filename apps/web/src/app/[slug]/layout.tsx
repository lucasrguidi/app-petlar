import { db } from '@app-petlar/db'
import { orgs } from '@app-petlar/db/schema'
import { eq } from 'drizzle-orm'
import { notFound } from 'next/navigation'

interface OrgLayoutProps {
  children: React.ReactNode
  params: Promise<{ slug: string }>
}

async function getOrg(slug: string) {
  const [org] = await db
    .select({
      id: orgs.id,
      name: orgs.name,
      slug: orgs.slug,
    })
    .from(orgs)
    .where(eq(orgs.slug, slug))

  return org ?? null
}

export default async function OrgLayout({ children, params }: OrgLayoutProps) {
  const { slug } = await params
  const org = await getOrg(slug)

  if (!org) {
    notFound()
  }

  return <>{children}</>
}
