import { db } from '@app-petlar/db'
import { orgs } from '@app-petlar/db/schema'
import { env } from '@app-petlar/env/server'
import { type MetadataRoute } from 'next'

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = env.BETTER_AUTH_URL

  const allOrgs = await db
    .select({
      slug: orgs.slug,
      customDomain: orgs.customDomain,
      updatedAt: orgs.updatedAt,
    })
    .from(orgs)

  const orgEntries: MetadataRoute.Sitemap = allOrgs.flatMap((org) => {
    const entries: MetadataRoute.Sitemap = []

    entries.push({
      url: `${baseUrl}/${org.slug}`,
      lastModified: org.updatedAt,
      changeFrequency: 'weekly',
      priority: 0.8,
    })

    if (org.customDomain) {
      entries.push({
        url: `https://${org.customDomain}`,
        lastModified: org.updatedAt,
        changeFrequency: 'weekly',
        priority: 1.0,
      })
    }

    return entries
  })

  return [
    {
      url: baseUrl,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 1.0,
    },
    ...orgEntries,
  ]
}
