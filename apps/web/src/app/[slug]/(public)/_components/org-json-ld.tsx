interface OrgJsonLdProps {
  orgName: string
  orgLogo: string | null
  city: string | null
  state: string | null
  canonicalUrl: string
}

export function OrgJsonLd({
  orgName,
  orgLogo,
  city,
  state,
  canonicalUrl,
}: OrgJsonLdProps) {
  const locationSuffix = city
    ? ` em ${city}${state ? `, ${state}` : ''}`
    : ''

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'AnimalShelter',
    name: orgName,
    url: canonicalUrl,
    ...(orgLogo && { logo: orgLogo }),
    ...(city && {
      address: {
        '@type': 'PostalAddress',
        addressLocality: city,
        ...(state && { addressRegion: state }),
        addressCountry: 'BR',
      },
    }),
    description: `${orgName} - Adoção responsável de gatos${locationSuffix}.`,
  }

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
    />
  )
}
