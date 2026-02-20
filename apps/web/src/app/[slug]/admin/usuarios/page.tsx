import { auth } from '@app-petlar/auth'
import { Users } from 'lucide-react'
import { headers } from 'next/headers'
import { redirect } from 'next/navigation'
import { Suspense } from 'react'

import { UsersLoadingSkeleton } from './_components/users-loading-skeleton'
import { UsersPageContent } from './_components/users-page-content'

interface UsuariosPageProps {
  params: Promise<{ slug: string }>
  searchParams: Promise<{
    search?: string
    page?: string
  }>
}

export default async function UsuariosPage({
  params,
  searchParams,
}: UsuariosPageProps) {
  const { slug } = await params
  const filters = await searchParams

  const session = await auth.api.getSession({ headers: await headers() })

  if (!session || session.user.role !== 'admin') {
    redirect(`/${slug}/admin`)
  }

  return (
    <div className="mx-auto flex h-full w-full max-w-6xl flex-col">
      <div className="flex shrink-0 flex-col gap-4 pb-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="space-y-1">
          <h1 className="text-display flex items-center gap-2 text-2xl font-bold tracking-tight">
            <Users className="text-primary h-6 w-6" />
            Equipe
          </h1>
          <p className="text-muted-foreground">
            Gerencie os membros da sua organização
          </p>
        </div>
      </div>

      <Suspense fallback={<UsersLoadingSkeleton />}>
        <UsersPageContent searchParams={filters} />
      </Suspense>
    </div>
  )
}
