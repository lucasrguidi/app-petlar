import { db } from '@app-petlar/db'
import { orgs } from '@app-petlar/db/schema'
import { eq } from 'drizzle-orm'

/**
 * Main domains that use slug-based routing (not custom domains).
 * Add production domains here as needed.
 */
const MAIN_DOMAINS = [
  'localhost',
  '127.0.0.1',
  'petlar.com',
  'www.petlar.com',
  'petlar.vercel.app',
  'app-petlar-web.vercel.app',
]

/**
 * Simple in-memory cache for custom domain lookups.
 * TTL of 5 minutes to balance freshness with performance.
 */
const domainCache = new Map<
  string,
  { slug: string | null; expiresAt: number }
>()
const CACHE_TTL_MS = 5 * 60 * 1000

/**
 * Checks if the hostname is a main domain (uses slug-based routing).
 */
export function isMainDomain(hostname: string): boolean {
  const cleanHost = hostname.split(':')[0]?.toLowerCase() ?? ''
  return MAIN_DOMAINS.some(
    (domain) => cleanHost === domain || cleanHost.endsWith(`.${domain}`)
  )
}

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
