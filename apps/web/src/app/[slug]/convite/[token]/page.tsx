import { db } from '@app-petlar/db'
import { orgs } from '@app-petlar/db/schema'
import { eq } from 'drizzle-orm'
import { PawPrint, Shield, Users } from 'lucide-react'
import { type Metadata } from 'next'
import { notFound } from 'next/navigation'
import { Suspense } from 'react'

import { AcceptInviteForm } from './_components/accept-invite-form'

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'

interface InvitePageProps {
  params: Promise<{ slug: string; token: string }>
}

export const metadata: Metadata = {
  robots: {
    index: false,
    follow: false,
  },
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

function OrgLogo({
  logoUrl,
  orgName,
}: {
  logoUrl: string | null
  orgName: string
}) {
  return (
    <div className="relative">
      <div className="animate-pulse-soft from-primary/20 via-accent/10 to-primary/20 absolute -inset-3 rounded-2xl bg-gradient-to-br blur-xl" />
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
      <div className="border-card bg-success absolute -right-1 -bottom-1 flex h-6 w-6 items-center justify-center rounded-full border-2 shadow-sm">
        <Users className="h-3 w-3 text-white" />
      </div>
    </div>
  )
}

function FormSkeleton() {
  return (
    <div className="space-y-5">
      <Skeleton className="h-12 w-full rounded-xl" />
      <Skeleton className="h-12 w-full rounded-xl" />
      <Skeleton className="h-12 w-full rounded-xl" />
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

export default async function InvitePage({ params }: InvitePageProps) {
  const { slug, token } = await params
  const org = await getOrg(slug)

  if (!org) {
    notFound()
  }

  return (
    <div className="relative flex min-h-screen items-center justify-center p-4">
      <div className="from-background via-muted/30 to-background pointer-events-none fixed inset-0 bg-gradient-to-br" />

      <div
        className="pointer-events-none fixed inset-0 opacity-[0.02]"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23783201' fill-opacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
        }}
      />

      <div className="bg-primary/5 pointer-events-none fixed top-10 left-10 h-64 w-64 rounded-full blur-3xl" />
      <div className="bg-accent/5 pointer-events-none fixed right-10 bottom-10 h-96 w-96 rounded-full blur-3xl" />

      <div className="animate-fade-in-up relative z-10 w-full max-w-md">
        <Card className="bg-card/95 shadow-warm-xl overflow-hidden rounded-2xl border-0 backdrop-blur-sm">
          <CardHeader className="space-y-6 pt-8 pb-2 text-center">
            <div className="flex justify-center">
              <OrgLogo logoUrl={org.logoUrl} orgName={org.name} />
            </div>

            <div className="space-y-3">
              <CardTitle className="text-display text-foreground text-2xl font-bold tracking-tight">
                {org.name}
              </CardTitle>
              <FeatureBadge>
                <Shield className="h-3 w-3" />
                Convite para a Equipe
              </FeatureBadge>
            </div>

          </CardHeader>

          <CardContent className="px-6 pt-2 pb-6">
            <Suspense fallback={<FormSkeleton />}>
              <AcceptInviteForm token={token} />
            </Suspense>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
