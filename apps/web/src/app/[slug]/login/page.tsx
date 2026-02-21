import { PawPrint, Shield } from 'lucide-react'
import { type Metadata, type Route } from 'next'
import { notFound, redirect } from 'next/navigation'
import { Suspense } from 'react'

import { getOrgBySlug } from '../_lib/get-org-by-slug'

import { SignInForm } from './_components/sign-in-form'

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { sanitizeCallbackUrlForOrg } from '@/lib/auth-routing'
import { getActiveSessionUser } from '@/lib/server-auth'

interface LoginPageProps {
  params: Promise<{ slug: string }>
  searchParams: Promise<{ callbackUrl?: string }>
}

export const metadata: Metadata = {
  robots: {
    index: false,
    follow: false,
  },
}

function OrgLogo({
  logoUrl,
  orgName,
}: {
  logoUrl: string | null
  orgName: string
}) {
  return (
    <div className="relative">
      {/* Outer glow ring */}
      <div className="animate-pulse-soft from-primary/20 via-accent/10 to-primary/20 absolute -inset-3 rounded-2xl bg-gradient-to-br blur-xl" />

      {/* Logo container */}
      <div className="from-primary to-accent shadow-warm-lg relative flex h-20 w-20 items-center justify-center overflow-hidden rounded-2xl bg-gradient-to-br">
        {logoUrl ? (
          <img
            src={logoUrl}
            alt={`Logo ${orgName}`}
            className="h-full w-full object-cover"
          />
        ) : (
          <PawPrint className="h-10 w-10 text-white" strokeWidth={1.5} />
        )}
      </div>

      {/* Status badge */}
      <div className="border-card bg-success absolute -right-1 -bottom-1 flex h-6 w-6 items-center justify-center rounded-full border-2 shadow-sm">
        <Shield className="h-3 w-3 text-white" />
      </div>
    </div>
  )
}

function FormSkeleton() {
  return (
    <div className="space-y-5">
      <div className="space-y-2">
        <Skeleton className="h-4 w-16 rounded" />
        <Skeleton className="h-12 w-full rounded-xl" />
      </div>
      <div className="space-y-2">
        <Skeleton className="h-4 w-12 rounded" />
        <Skeleton className="h-12 w-full rounded-xl" />
      </div>
      <Skeleton className="h-12 w-full rounded-xl" />
    </div>
  )
}

function FeatureBadge({ children }: { children: React.ReactNode }) {
  return (
    <div className="bg-primary/10 text-primary inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium">
      {children}
    </div>
  )
}

export default async function OrgLoginPage({
  params,
  searchParams,
}: LoginPageProps) {
  const [{ slug }, query, currentUser] = await Promise.all([
    params,
    searchParams,
    getActiveSessionUser(),
  ])
  const org = await getOrgBySlug(slug)

  if (!org) {
    notFound()
  }

  const safeCallbackUrl = sanitizeCallbackUrlForOrg(query.callbackUrl, slug)

  if (currentUser?.orgId === org.id) {
    redirect((safeCallbackUrl ?? `/${slug}/admin`) as Route)
  }

  return (
    <div className="relative flex min-h-screen items-center justify-center p-4">
      {/* Background gradient */}
      <div className="from-background via-muted/30 to-background pointer-events-none fixed inset-0 bg-gradient-to-br" />

      {/* Decorative pattern */}
      <div
        className="pointer-events-none fixed inset-0 opacity-[0.02]"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23783201' fill-opacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
        }}
      />

      {/* Floating decorative elements */}
      <div className="bg-primary/5 pointer-events-none fixed top-10 left-10 h-64 w-64 rounded-full blur-3xl" />
      <div className="bg-accent/5 pointer-events-none fixed right-10 bottom-10 h-96 w-96 rounded-full blur-3xl" />

      {/* Login card */}
      <div className="animate-fade-in-up relative z-10 w-full max-w-md">
        <Card className="bg-card/95 shadow-warm-xl overflow-hidden rounded-2xl border-0 backdrop-blur-sm">
          <CardHeader className="space-y-6 pt-8 pb-2 text-center">
            {/* Logo */}
            <div className="flex justify-center">
              <OrgLogo logoUrl={org.logoUrl} orgName={org.name} />
            </div>

            {/* Org name & badge */}
            <div className="space-y-3">
              <CardTitle className="text-display text-foreground text-2xl font-bold tracking-tight">
                {org.name}
              </CardTitle>
              <FeatureBadge>
                <Shield className="h-3 w-3" />
                Painel Administrativo
              </FeatureBadge>
            </div>

            {/* Description */}
            <CardDescription className="text-muted-foreground mx-auto max-w-xs text-base text-balance">
              Entre com suas credenciais para acessar o painel.
            </CardDescription>
          </CardHeader>

          <CardContent className="px-8 pt-4 pb-8">
            <Suspense fallback={<FormSkeleton />}>
              <SignInForm orgId={org.id} callbackUrl={safeCallbackUrl} />
            </Suspense>

            {/* Divider */}
            <div className="relative my-6">
              <div className="absolute inset-0 flex items-center">
                <div className="border-border/50 w-full border-t" />
              </div>
              <div className="relative flex justify-center">
                <span className="bg-card text-muted-foreground px-3 text-xs">
                  Acesso seguro
                </span>
              </div>
            </div>

            {/* Security info */}
            <div className="text-muted-foreground flex items-center justify-center gap-4 text-xs">
              <div className="flex items-center gap-1">
                <div className="bg-success h-1.5 w-1.5 rounded-full" />
                <span>Conexão segura</span>
              </div>
              <div className="flex items-center gap-1">
                <div className="bg-success h-1.5 w-1.5 rounded-full" />
                <span>Dados protegidos</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
