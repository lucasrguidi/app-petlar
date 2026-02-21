import { NextResponse, type NextRequest } from 'next/server'

import { buildLoginRedirectPathForProtectedRoute, isProtectedRoute } from './lib/auth-routing'

export async function proxy(request: NextRequest) {
  const { pathname, search } = request.nextUrl

  if (!isProtectedRoute(pathname)) {
    return NextResponse.next()
  }

  const sessionToken = request.cookies.get('better-auth.session_token')
  if (sessionToken) {
    return NextResponse.next()
  }

  const loginPath = buildLoginRedirectPathForProtectedRoute(pathname, search)
  if (!loginPath) {
    return NextResponse.next()
  }

  return NextResponse.redirect(new URL(loginPath, request.url))
}

export const config = {
  matcher: [
    // Proteger todas as rotas exceto arquivos estáticos
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
