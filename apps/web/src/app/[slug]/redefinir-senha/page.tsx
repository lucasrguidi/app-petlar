import { AlertTriangle, KeyRound, PawPrint, RefreshCw } from 'lucide-react'
import { type Metadata, type Route } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { Suspense } from 'react'

import { getOrgBySlug } from '../_lib/get-org-by-slug'

import { ResetPasswordForm } from './_components/reset-password-form'

import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'

interface ResetPasswordPageProps {
  params: Promise<{ slug: string }>
  searchParams: Promise<{ token?: string }>
}

export const metadata: Metadata = {
  title: 'Redefinir senha',
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
      <div className="border-card bg-primary absolute -right-1 -bottom-1 flex h-6 w-6 items-center justify-center rounded-full border-2 shadow-sm">
        <KeyRound className="h-3 w-3 text-white" />
      </div>
    </div>
  )
}

function FormSkeleton() {
  return (
    <div className="space-y-5">
      <div className="space-y-2">
        <Skeleton className="h-4 w-24 rounded" />
        <Skeleton className="h-12 w-full rounded-xl" />
      </div>
      <div className="space-y-2">
        <Skeleton className="h-4 w-32 rounded" />
        <Skeleton className="h-12 w-full rounded-xl" />
      </div>
      <Skeleton className="h-12 w-full rounded-xl" />
    </div>
  )
}

function MissingTokenState({ slug }: { slug: string }) {
  return (
    <div className="space-y-6 text-center">
      <div className="flex justify-center">
        <div className="bg-destructive/10 flex h-16 w-16 items-center justify-center rounded-full">
          <AlertTriangle className="text-destructive h-8 w-8" />
        </div>
      </div>

      <div className="space-y-2">
        <h3 className="text-foreground text-lg font-semibold">Link inválido</h3>
        <p className="text-muted-foreground text-sm text-balance">
          O link de redefinição de senha está incompleto ou inválido.
        </p>
      </div>

      <div className="flex flex-col gap-3 pt-2">
        <Button asChild className="rounded-xl">
          <Link href={`/${slug}/esqueci-senha` as Route}>
            <RefreshCw className="mr-2 h-4 w-4" />
            Solicitar novo link
          </Link>
        </Button>
        <Button asChild variant="outline" className="rounded-xl">
          <Link href={`/${slug}/login` as Route}>Voltar para login</Link>
        </Button>
      </div>
    </div>
  )
}

export default async function ResetPasswordPage({
  params,
  searchParams,
}: ResetPasswordPageProps) {
  const [{ slug }, query] = await Promise.all([params, searchParams])
  const org = await getOrgBySlug(slug)

  if (!org) {
    notFound()
  }

  const token = query.token

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

      {/* Reset password card */}
      <div className="animate-fade-in-up relative z-10 w-full max-w-md">
        <Card className="bg-card/95 shadow-warm-xl overflow-hidden rounded-2xl border-0 backdrop-blur-sm">
          <CardHeader className="space-y-6 pt-8 pb-2 text-center">
            {/* Logo */}
            <div className="flex justify-center">
              <OrgLogo logoUrl={org.logoUrl} orgName={org.name} />
            </div>

            {/* Title */}
            {token && (
              <div className="space-y-3">
                <CardTitle className="text-display text-foreground text-2xl font-bold tracking-tight">
                  Criar nova senha
                </CardTitle>
              </div>
            )}

            {/* Description */}
            {token && (
              <CardDescription className="text-muted-foreground mx-auto max-w-xs text-base text-balance">
                Digite e confirme sua nova senha abaixo.
              </CardDescription>
            )}
          </CardHeader>

          <CardContent className="px-8 pt-4 pb-8">
            {token ? (
              <Suspense fallback={<FormSkeleton />}>
                <ResetPasswordForm token={token} />
              </Suspense>
            ) : (
              <MissingTokenState slug={slug} />
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
