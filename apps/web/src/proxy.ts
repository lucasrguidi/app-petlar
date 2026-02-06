import { NextResponse } from 'next/server'

import type { NextRequest } from 'next/server'

// Rotas públicas que não precisam de autenticação
const publicRoutes = ['/', '/login']

// Rotas que começam com esses prefixos são públicas
const publicPrefixes = ['/api/auth', '/api/trpc']

// Rotas que terminam com /login são públicas (login de org)
function isOrgLoginRoute(pathname: string): boolean {
  return pathname.match(/^\/[^/]+\/login$/) !== null
}

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl

  // Verificar se é rota de login de org (ex: /petlar/login)
  if (isOrgLoginRoute(pathname)) {
    return NextResponse.next()
  }

  // Verificar se é rota pública
  const isPublicRoute = publicRoutes.includes(pathname)
  const isPublicPrefix = publicPrefixes.some((prefix) =>
    pathname.startsWith(prefix)
  )

  if (isPublicRoute || isPublicPrefix) {
    return NextResponse.next()
  }

  // Extrair slug da URL (ex: /petlar/admin -> petlar)
  const slugMatch = pathname.match(/^\/([^/]+)/)
  const slug = slugMatch?.[1]

  // Verificar sessão via cookie
  const sessionToken = request.cookies.get('better-auth.session_token')

  if (!sessionToken) {
    // Redirecionar para login da org
    if (slug) {
      const loginUrl = new URL(`/${slug}/login`, request.url)
      loginUrl.searchParams.set('callbackUrl', pathname)
      return NextResponse.redirect(loginUrl)
    }

    // Fallback para login genérico
    const loginUrl = new URL('/login', request.url)
    loginUrl.searchParams.set('callbackUrl', pathname)
    return NextResponse.redirect(loginUrl)
  }

  // Nota: A validação de que o usuário pertence à org correta
  // é feita no componente da página (client-side) ou via tRPC
  // pois o proxy não tem acesso ao banco de dados

  return NextResponse.next()
}

export const config = {
  matcher: [
    // Proteger todas as rotas exceto arquivos estáticos
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
