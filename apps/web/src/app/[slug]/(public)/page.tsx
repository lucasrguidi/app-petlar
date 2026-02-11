import { HomeCatsPreview } from './_components/home-cats-preview'
import { HomeHero } from './_components/home-hero'
import { HomeHowItWorks } from './_components/home-how-it-works'

interface PublicHomePageProps {
  params: Promise<{ slug: string }>
}

export default async function PublicHomePage({ params }: PublicHomePageProps) {
  const { slug } = await params

  return (
    <>
      <HomeHero slug={slug} />
      <HomeHowItWorks />
      <HomeCatsPreview slug={slug} />
    </>
  )
}
