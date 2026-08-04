import { env } from '@app-petlar/env/server'
import { type Metadata } from 'next'
import { headers } from 'next/headers'
import { notFound } from 'next/navigation'

import { getOrgBySlug } from '../_lib/get-org-by-slug'

import { OrgJsonLd } from './_components/org-json-ld'
import { PublicFooter } from './_components/public-footer'
import { PublicHeader } from './_components/public-header'

import { getIsCustomDomain } from '@/lib/get-is-custom-domain'
import { isMainDomain } from '@/lib/main-domains'
import { buildOrgHref } from '@/lib/org-href'



interface PublicLayoutProps {
  children: React.ReactNode
  params: Promise<{ slug: string }>
}

interface PublicMetadataProps {
  params: Promise<{ slug: string }>
}

const defaultDescription =
  'Conheça os gatinhos disponíveis para adoção e envie sua candidatura de forma simples e responsável.'

export async function generateMetadata({
  params,
}: PublicMetadataProps): Promise<Metadata> {
  const [{ slug }, headersList] = await Promise.all([params, headers()])
  const org = await getOrgBySlug(slug)

  if (!org) {
    return {
      title: 'PetLar | Adoção responsável',
      description: defaultDescription,
      robots: {
        index: false,
        follow: false,
      },
    }
  }

  const host = headersList.get('host') ?? ''
  const isCustomDomain = !isMainDomain(host)
  const metadataBase = isCustomDomain
    ? new URL(`https://${host}`)
    : new URL(env.BETTER_AUTH_URL)
  const canonicalPath = buildOrgHref('/', slug, isCustomDomain)
  const canonicalUrl = new URL(canonicalPath, metadataBase).toString()
  const locationSuffix = org.city
    ? ` em ${org.city}${org.state ? `, ${org.state}` : ''}`
    : ''
  const title = org.city
    ? `${org.name} | Adoção de Gatos${locationSuffix}`
    : `${org.name} | Adoção de Gatos`
  const description = `Conheça os gatinhos disponíveis para adoção na ${org.name}${locationSuffix}. Processo simples, acolhedor e responsável.`
  const images = org.logoUrl
    ? [{ url: org.logoUrl, alt: `Logo ${org.name}` }]
    : undefined

  return {
    metadataBase,
    title,
    description,
    alternates: {
      canonical: canonicalPath,
    },
    openGraph: {
      title,
      description,
      type: 'website',
      locale: 'pt_BR',
      siteName: 'PetLar',
      url: canonicalUrl,
      images,
    },
    twitter: {
      card: images ? 'summary_large_image' : 'summary',
      title,
      description,
      images: images?.map((image) => image.url),
    },
    robots: {
      index: true,
      follow: true,
    },
    ...(org.city && {
      other: {
        'geo.placename': `${org.city}${org.state ? `, ${org.state}` : ''}`,
        ...(org.state && { 'geo.region': `BR-${org.state}` }),
      },
    }),
  }
}

export default async function PublicLayout({
  children,
  params,
}: PublicLayoutProps) {
  const { slug } = await params
  const [org, isCustomDomain, headersList] = await Promise.all([
    getOrgBySlug(slug),
    getIsCustomDomain(),
    headers(),
  ])

  if (!org) {
    notFound()
  }

  const host = headersList.get('host') ?? ''
  const isCustomDomainHost = !isMainDomain(host)
  const metadataBase = isCustomDomainHost
    ? `https://${host}`
    : env.BETTER_AUTH_URL
  const canonicalUrl = `${metadataBase}${buildOrgHref('/', slug, isCustomDomain)}`

  return (
    <div className="bg-background relative min-h-screen">
      <OrgJsonLd
        orgName={org.name}
        orgLogo={org.logoUrl}
        city={org.city}
        state={org.state}
        canonicalUrl={canonicalUrl}
      />
      {/* Gradient overlays for depth - uses theme colors */}
      <div className="pointer-events-none fixed inset-0">
        {/* Warm accent top-left */}
        <div
          className="absolute -top-[20%] -left-[10%] h-[600px] w-[600px] rounded-full opacity-60 blur-3xl"
          style={{
            background:
              'radial-gradient(circle, color-mix(in srgb, var(--theme-primary) 15%, transparent) 0%, color-mix(in srgb, var(--theme-accent) 10%, transparent) 40%, transparent 70%)',
          }}
        />
        {/* Light center area */}
        <div
          className="absolute top-[20%] left-[20%] h-[800px] w-[800px] rounded-full opacity-40 blur-3xl"
          style={{
            background:
              'radial-gradient(circle, rgba(255,255,255,0.5) 0%, transparent 60%)',
          }}
        />
        {/* Accent bottom-right */}
        <div
          className="absolute -right-[10%] -bottom-[10%] h-[500px] w-[500px] rounded-full opacity-50 blur-3xl"
          style={{
            background:
              'radial-gradient(circle, color-mix(in srgb, var(--theme-primary) 12%, transparent) 0%, color-mix(in srgb, var(--theme-background) 30%, transparent) 50%, transparent 70%)',
          }}
        />
      </div>

      {/* Subtle pattern overlay */}
      <div
        className="pointer-events-none fixed inset-0 opacity-[0.03]"
        style={{
          backgroundImage: `radial-gradient(circle at 1px 1px, var(--theme-foreground) 1px, transparent 0)`,
          backgroundSize: '32px 32px',
        }}
      />

      <div className="relative z-10 flex min-h-screen flex-col">
        <PublicHeader orgName={org.name} orgLogo={org.logoUrl} />
        <main className="flex-1">{children}</main>
        <PublicFooter orgName={org.name} slug={slug} isCustomDomain={isCustomDomain} city={org.city} state={org.state} />
      </div>
    </div>
  )
}
