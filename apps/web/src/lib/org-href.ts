export function buildOrgHref(
  path: string,
  slug: string,
  isCustomDomain: boolean
): string {
  const prefix = isCustomDomain ? '' : `/${slug}`

  if (!path || path === '/') return prefix || '/'
  if (path.startsWith('#')) return `${prefix || '/'}${path}`
  return `${prefix}${path}`
}
