'use client'

import { useParams } from 'next/navigation'

/**
 * Hook to get the current org slug from URL params.
 * Use this instead of prop drilling orgSlug through components.
 */
export function useOrgSlug(): string {
  const { slug } = useParams<{ slug: string }>()
  return slug
}
