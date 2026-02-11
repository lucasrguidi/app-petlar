import { db } from '@app-petlar/db'
import { orgs } from '@app-petlar/db/schema'
import { eq } from 'drizzle-orm'
import { cache } from 'react'

export interface OrgBySlug {
  id: string
  name: string
  slug: string
  logoUrl: string | null
}

/**
 * Shared org lookup for slug routes.
 * Uses React cache to dedupe repeated reads in a single request.
 */
export const getOrgBySlug = cache(
  async (slug: string): Promise<OrgBySlug | null> => {
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
)
