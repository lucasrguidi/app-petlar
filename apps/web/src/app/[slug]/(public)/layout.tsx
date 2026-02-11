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
    <div className="from-background via-muted/20 to-background relative min-h-screen bg-gradient-to-b">
      <div
        className="pointer-events-none fixed inset-0 opacity-[0.02]"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23783201' fill-opacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
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
