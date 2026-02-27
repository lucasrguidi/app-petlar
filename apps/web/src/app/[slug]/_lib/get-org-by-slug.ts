import { db } from '@app-petlar/db'
import { orgs } from '@app-petlar/db/schema'
import { eq } from 'drizzle-orm'
import { cache } from 'react'

export interface OrgTheme {
  primaryColor: string | null
  primaryForegroundColor: string | null
  secondaryColor: string | null
  secondaryForegroundColor: string | null
  backgroundColor: string | null
  foregroundColor: string | null
  accentColor: string | null
  mutedColor: string | null
  mutedForegroundColor: string | null
}

export interface OrgBySlug extends OrgTheme {
  id: string
  name: string
  slug: string
  logoUrl: string | null
  customDomain: string | null
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
        customDomain: orgs.customDomain,
        primaryColor: orgs.primaryColor,
        primaryForegroundColor: orgs.primaryForegroundColor,
        secondaryColor: orgs.secondaryColor,
        secondaryForegroundColor: orgs.secondaryForegroundColor,
        backgroundColor: orgs.backgroundColor,
        foregroundColor: orgs.foregroundColor,
        accentColor: orgs.accentColor,
        mutedColor: orgs.mutedColor,
        mutedForegroundColor: orgs.mutedForegroundColor,
      })
      .from(orgs)
      .where(eq(orgs.slug, slug))

    return org ?? null
  }
)
