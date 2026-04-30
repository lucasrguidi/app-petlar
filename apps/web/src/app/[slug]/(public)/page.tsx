
import { HomeHero } from './_components/home-hero'
import { HomeHowItWorks } from './_components/home-how-it-works'
import { PublicCatsSection } from './_components/public-cats-section'
import { SponsorsSection } from './_components/sponsors-section'

import { getIsCustomDomain } from '@/lib/get-is-custom-domain'

interface PublicHomePageProps {
  params: Promise<{ slug: string }>
}

export default async function PublicHomePage({ params }: PublicHomePageProps) {
  const { slug } = await params
  const isCustomDomain = await getIsCustomDomain()

  return (
    <>
      <HomeHero slug={slug} isCustomDomain={isCustomDomain} />
      <HomeHowItWorks />
      <PublicCatsSection />
      <SponsorsSection />
    </>
  )
}
