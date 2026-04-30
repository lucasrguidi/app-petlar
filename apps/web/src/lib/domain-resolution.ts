import { db } from '@app-petlar/db'
import { orgs } from '@app-petlar/db/schema'
import { eq } from 'drizzle-orm'

import { isMainDomain } from './main-domains'

export { isMainDomain }

const domainCache = new Map<
  string,
  { slug: string | null; expiresAt: number }
>()
const CACHE_TTL_MS = 5 * 60 * 1000

/**
 * Gets the org slug for a custom domain.
 * Returns null if the domain is not configured or not found.
 * Uses in-memory caching with 5-minute TTL.
 */
export async function getOrgSlugByDomain(
  hostname: string
): Promise<string | null> {
  const cleanHost = hostname.split(':')[0]?.toLowerCase() ?? ''

  // Check cache first
  const cached = domainCache.get(cleanHost)
  if (cached && cached.expiresAt > Date.now()) {
    return cached.slug
  }

  // Query database
  const [org] = await db
    .select({ slug: orgs.slug })
    .from(orgs)
    .where(eq(orgs.customDomain, cleanHost))

  const slug = org?.slug ?? null

  // Cache the result (including null for not-found domains)
  domainCache.set(cleanHost, {
    slug,
    expiresAt: Date.now() + CACHE_TTL_MS,
  })

  return slug
}

/**
 * Clears the domain cache. Useful for testing or after domain updates.
 */
export function clearDomainCache(): void {
  domainCache.clear()
}
