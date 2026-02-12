import { env } from '@app-petlar/env/server'
import { type Metadata } from 'next'
import { notFound } from 'next/navigation'

import { getOrgBySlug } from '../_lib/get-org-by-slug'

import { PublicFooter } from './_components/public-footer'
import { PublicHeader } from './_components/public-header'

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
  const { slug } = await params
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

  const metadataBase = new URL(env.BETTER_AUTH_URL)
  const canonicalPath = `/${slug}`
  const canonicalUrl = new URL(canonicalPath, metadataBase).toString()
  const title = `${org.name} | Adoção de Gatos`
  const description = `Conheça os gatinhos disponíveis para adoção na ${org.name}. Processo simples, acolhedor e responsável.`
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
  }
}

export default async function PublicLayout({
  children,
  params,
}: PublicLayoutProps) {
  const { slug } = await params
  const org = await getOrgBySlug(slug)

  if (!org) {
    notFound()
  }

  return (
    <div className="relative min-h-screen bg-[#AEC7E2]">
      {/* Gradient overlays for depth */}
      <div className="pointer-events-none fixed inset-0">
        {/* Warm accent top-left */}
        <div
          className="absolute -top-[20%] -left-[10%] h-[600px] w-[600px] rounded-full opacity-60 blur-3xl"
          style={{
            background:
              'radial-gradient(circle, rgba(227,89,21,0.15) 0%, rgba(240,123,61,0.1) 40%, transparent 70%)',
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
              'radial-gradient(circle, rgba(227,89,21,0.12) 0%, rgba(174,199,226,0.3) 50%, transparent 70%)',
          }}
        />
      </div>

      {/* Subtle pattern overlay */}
      <div
        className="pointer-events-none fixed inset-0 opacity-[0.03]"
        style={{
          backgroundImage: `radial-gradient(circle at 1px 1px, #783201 1px, transparent 0)`,
          backgroundSize: '32px 32px',
        }}
      />

      <div className="relative z-10 flex min-h-screen flex-col">
        <PublicHeader orgName={org.name} orgLogo={org.logoUrl} />
        <main className="flex-1">{children}</main>
        <PublicFooter orgName={org.name} slug={slug} />
      </div>
    </div>
  )
}
