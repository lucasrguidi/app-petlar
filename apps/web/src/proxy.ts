import { NextResponse, type NextRequest } from 'next/server'

import {
  buildLoginRedirectPathForProtectedRoute,
  isProtectedRoute,
} from './lib/auth-routing'
import { getOrgSlugByDomain, isMainDomain } from './lib/domain-resolution'

export async function proxy(request: NextRequest) {
  const { pathname, search } = request.nextUrl
  const hostname = request.headers.get('host') ?? ''

  // Detect custom domain and resolve org slug
  const isCustomDomain = !isMainDomain(hostname)
  let effectivePathname = pathname
  let orgSlug: string | null = null

  if (isCustomDomain) {
    orgSlug = await getOrgSlugByDomain(hostname)

    if (!orgSlug) {
      // Domain not configured - redirect to main site
      return NextResponse.redirect(new URL('https://petlar.com'))
    }

    // Effective pathname includes the org slug (for route matching)
    effectivePathname = `/${orgSlug}${pathname}`
  }

  // Auth protection check (works for both main domains and custom domains)
  if (isProtectedRoute(effectivePathname)) {
    const sessionToken = request.cookies.get('better-auth.session_token')

    if (!sessionToken) {
      const loginPath = buildLoginRedirectPathForProtectedRoute(
        effectivePathname,
        search
      )

      if (loginPath) {
        if (isCustomDomain) {
          // For custom domains, redirect to the login page on the custom domain
          // Remove the slug prefix from the loginPath since custom domain URLs don't have it
          const loginPathWithoutSlug = loginPath.replace(`/${orgSlug}`, '')
          return NextResponse.redirect(new URL(loginPathWithoutSlug, request.url))
        }
        return NextResponse.redirect(new URL(loginPath, request.url))
      }
    }
  }

  // Custom domain: rewrite URL to include org slug internally
  if (isCustomDomain && orgSlug) {
    const rewrittenUrl = new URL(`/${orgSlug}${pathname}${search}`, request.url)
    return NextResponse.rewrite(rewrittenUrl)
  }

  return NextResponse.next()
}

export const config = {
  matcher: [
    // Proteger todas as rotas exceto arquivos estáticos
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
