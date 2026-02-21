const ROOT_ADMIN_ROUTE_REGEX = /^\/admin(?:\/|$)/
const ORG_ADMIN_ROUTE_REGEX = /^\/([^/]+)\/admin(?:\/|$)/

const MAX_CALLBACK_URL_LENGTH = 2048

export type ProtectedRouteMatch =
  | { type: 'root-admin' }
  | { type: 'org-admin'; slug: string }

export function matchProtectedRoute(pathname: string): ProtectedRouteMatch | null {
  if (ROOT_ADMIN_ROUTE_REGEX.test(pathname)) {
    return { type: 'root-admin' }
  }

  const orgAdminMatch = pathname.match(ORG_ADMIN_ROUTE_REGEX)
  if (!orgAdminMatch?.[1]) {
    return null
  }

  return {
    type: 'org-admin',
    slug: orgAdminMatch[1],
  }
}

export function isProtectedRoute(pathname: string): boolean {
  return matchProtectedRoute(pathname) !== null
}

export function buildCallbackUrl(pathname: string, search = ''): string {
  return `${pathname}${search}`
}

export function buildLoginRedirectPathForProtectedRoute(
  pathname: string,
  search = ''
): string | null {
  const match = matchProtectedRoute(pathname)
  if (!match) {
    return null
  }

  const callbackUrl = buildCallbackUrl(pathname, search)
  const searchParams = new URLSearchParams({ callbackUrl })

  if (match.type === 'root-admin') {
    return `/login?${searchParams.toString()}`
  }

  return `/${match.slug}/login?${searchParams.toString()}`
}

export function sanitizeCallbackUrl(rawCallbackUrl: string | null | undefined): string | null {
  if (!rawCallbackUrl) {
    return null
  }

  const callbackUrl = rawCallbackUrl.trim()

  if (!callbackUrl) {
    return null
  }

  if (callbackUrl.length > MAX_CALLBACK_URL_LENGTH) {
    return null
  }

  if (!callbackUrl.startsWith('/') || callbackUrl.startsWith('//')) {
    return null
  }

  if (callbackUrl.includes('\n') || callbackUrl.includes('\r')) {
    return null
  }

  try {
    const parsed = new URL(callbackUrl, 'http://localhost')
    return `${parsed.pathname}${parsed.search}`
  } catch {
    return null
  }
}

export function sanitizeRootAdminCallbackUrl(
  rawCallbackUrl: string | null | undefined
): string | null {
  const callbackUrl = sanitizeCallbackUrl(rawCallbackUrl)

  if (!callbackUrl) {
    return null
  }

  if (callbackUrl === '/admin' || callbackUrl.startsWith('/admin/')) {
    return callbackUrl
  }

  return null
}

export function sanitizeCallbackUrlForOrg(
  rawCallbackUrl: string | null | undefined,
  slug: string
): string | null {
  const callbackUrl = sanitizeCallbackUrl(rawCallbackUrl)

  if (!callbackUrl) {
    return null
  }

  if (callbackUrl === '/admin' || callbackUrl.startsWith('/admin/')) {
    return callbackUrl
  }

  const orgAdminPrefix = `/${slug}/admin`
  if (callbackUrl === orgAdminPrefix || callbackUrl.startsWith(`${orgAdminPrefix}/`)) {
    return callbackUrl
  }

  return null
}

export function mapRootAdminCallbackUrlToOrg({
  slug,
  callbackUrl,
}: {
  slug: string
  callbackUrl: string | null | undefined
}): string | null {
  const safeRootCallback = sanitizeRootAdminCallbackUrl(callbackUrl)
  if (!safeRootCallback) {
    return null
  }

  if (safeRootCallback === '/admin') {
    return `/${slug}/admin`
  }

  return `/${slug}${safeRootCallback}`
}

export function buildOrgLoginPathFromRootCallback({
  slug,
  callbackUrl,
}: {
  slug: string
  callbackUrl: string | null | undefined
}): string {
  const mappedCallback = mapRootAdminCallbackUrlToOrg({ slug, callbackUrl })

  if (!mappedCallback) {
    return `/${slug}/login`
  }

  const searchParams = new URLSearchParams({ callbackUrl: mappedCallback })
  return `/${slug}/login?${searchParams.toString()}`
}

export function resolvePostLoginPath({
  slug,
  callbackUrl,
}: {
  slug: string
  callbackUrl: string | null | undefined
}): string {
  return sanitizeCallbackUrlForOrg(callbackUrl, slug) ?? `/${slug}/admin`
}
