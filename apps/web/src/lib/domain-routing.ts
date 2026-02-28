export function hasOrgSlugPrefix(pathname: string, slug: string): boolean {
  return pathname === `/${slug}` || pathname.startsWith(`/${slug}/`)
}

export function buildCustomDomainEffectivePathname(
  pathname: string,
  slug: string
): string {
  if (pathname === '/api' || pathname.startsWith('/api/')) {
    return pathname
  }

  if (hasOrgSlugPrefix(pathname, slug)) {
    return pathname
  }

  return `/${slug}${pathname}`
}
