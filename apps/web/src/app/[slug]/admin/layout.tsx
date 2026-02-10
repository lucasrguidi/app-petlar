import { auth } from '@app-petlar/auth'
import { db } from '@app-petlar/db'
import { orgs } from '@app-petlar/db/schema'
import { eq } from 'drizzle-orm'
import { headers } from 'next/headers'
import { notFound, redirect } from 'next/navigation'

import { AdminHeader } from './_components/admin-header'
import { AdminSidebar } from './_components/admin-sidebar'

interface AdminLayoutProps {
  children: React.ReactNode
  params: Promise<{ slug: string }>
}

async function getOrg(slug: string) {
  const [org] = await db
    .select({
      id: orgs.id,
      name: orgs.name,
      slug: orgs.slug,
      logoUrl: orgs.logoUrl,
    })
    .from(orgs)
    .where(eq(orgs.slug, slug))

  return org ?? null
}

export default async function AdminLayout({
  children,
  params,
}: AdminLayoutProps) {
  const { slug } = await params

  const [org, session] = await Promise.all([
    getOrg(slug),
    auth.api.getSession({ headers: await headers() }),
  ])

  if (!org) {
    notFound()
  }

  if (!session?.user) {
    redirect(`/${slug}/login`)
  }

  const user = session.user as {
    id: string
    name: string
    email: string
    image: string | null
    orgId: string | null
    role: 'admin' | 'volunteer'
  }

  if (user.orgId !== org.id) {
    redirect(`/${slug}/login`)
  }

  return (
    <div className="from-background via-muted/20 to-background relative flex h-screen overflow-hidden bg-gradient-to-br">
      {/* Subtle background pattern */}
      <div
        className="pointer-events-none fixed inset-0 opacity-[0.015]"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23783201' fill-opacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
        }}
      />

      {/* Sidebar - fixed height */}
      <AdminSidebar
        orgSlug={org.slug}
        orgName={org.name}
        orgLogo={org.logoUrl}
        userRole={user.role}
      />

      {/* Main content area - flex column with fixed header */}
      <div className="flex min-w-0 flex-1 flex-col">
        <AdminHeader
          orgSlug={org.slug}
          user={{
            name: user.name,
            email: user.email,
            image: user.image,
            role: user.role,
          }}
        />

        {/* Content area - flex container for pages to fill */}
        <main className="flex min-h-0 flex-1 flex-col p-4 md:p-6 lg:p-8">
          <div className="mx-auto flex min-h-0 w-full max-w-7xl flex-1 flex-col">
            {children}
          </div>
        </main>
      </div>
    </div>
  )
}
