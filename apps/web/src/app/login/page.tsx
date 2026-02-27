import { Building2 } from 'lucide-react'
import { type Route } from 'next'
import { redirect } from 'next/navigation'

import { LoginHubForm } from './_components/login-hub-form'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { sanitizeRootAdminCallbackUrl } from '@/lib/auth-routing'
import { getSessionAdminPath } from '@/lib/server-auth'

/**
 * Hub de descoberta de ONG para acesso ao login por slug.
 */
interface LoginRedirectPageProps {
  searchParams: Promise<{ callbackUrl?: string }>
}

export default async function LoginRedirectPage({
  searchParams,
}: LoginRedirectPageProps) {
  const [query, adminPath] = await Promise.all([
    searchParams,
    getSessionAdminPath(),
  ])

  if (adminPath) {
    redirect(adminPath as Route)
  }

  const safeCallbackUrl = sanitizeRootAdminCallbackUrl(query.callbackUrl)

  return (
    <div className="from-background via-muted/30 to-background flex min-h-screen items-center justify-center bg-gradient-to-br p-4">
      <div className="w-full max-w-md">
        <Card className="rounded-2xl border-0 shadow-xl">
          <CardHeader className="space-y-3 text-center">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-[#E35915] to-[#F07B3D] text-white shadow-lg shadow-[#E35915]/25">
              <Building2 className="h-7 w-7" />
            </div>
            <CardTitle className="text-display text-2xl font-bold tracking-tight">
              Acessar painel da ONG
            </CardTitle>
            <p className="text-muted-foreground text-sm">
              Use o slug da organização para continuar. Se você já acessou neste
              navegador, pode entrar em 1 clique.
            </p>
          </CardHeader>
          <CardContent>
            <LoginHubForm callbackUrl={safeCallbackUrl} />
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
