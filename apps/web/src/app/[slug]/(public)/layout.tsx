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
          className="absolute -bottom-[10%] -right-[10%] h-[500px] w-[500px] rounded-full opacity-50 blur-3xl"
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

      {/* Floating paw prints decoration */}
      <div className="pointer-events-none fixed inset-0 overflow-hidden opacity-[0.06]">
        <svg
          className="absolute top-[12%] left-[6%] h-14 w-14 rotate-[-15deg] text-[#783201]"
          viewBox="0 0 24 24"
          fill="currentColor"
        >
          <path d="M12 10c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2zm0-4c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2zm4 4c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2zm-8 0c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2zm4 6c-2.2 0-4 1.8-4 4h8c0-2.2-1.8-4-4-4z" />
        </svg>
        <svg
          className="absolute top-[40%] right-[8%] h-10 w-10 rotate-[20deg] text-[#783201]"
          viewBox="0 0 24 24"
          fill="currentColor"
        >
          <path d="M12 10c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2zm0-4c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2zm4 4c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2zm-8 0c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2zm4 6c-2.2 0-4 1.8-4 4h8c0-2.2-1.8-4-4-4z" />
        </svg>
        <svg
          className="absolute bottom-[25%] left-[12%] h-8 w-8 rotate-[10deg] text-[#783201]"
          viewBox="0 0 24 24"
          fill="currentColor"
        >
          <path d="M12 10c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2zm0-4c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2zm4 4c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2zm-8 0c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2zm4 6c-2.2 0-4 1.8-4 4h8c0-2.2-1.8-4-4-4z" />
        </svg>
      </div>

      <div className="relative z-10 flex min-h-screen flex-col">
        <PublicHeader orgName={org.name} orgLogo={org.logoUrl} />
        <main className="flex-1">{children}</main>
        <PublicFooter orgName={org.name} slug={slug} />
      </div>
    </div>
  )
}
