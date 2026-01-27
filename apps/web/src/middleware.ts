import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

// Rotas públicas que não precisam de autenticação
const publicRoutes = ["/", "/login", "/signup"];

// Rotas que começam com esses prefixos são públicas
const publicPrefixes = ["/api/auth"];

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Verificar se é rota pública
  const isPublicRoute = publicRoutes.includes(pathname);
  const isPublicPrefix = publicPrefixes.some((prefix) =>
    pathname.startsWith(prefix)
  );

  if (isPublicRoute || isPublicPrefix) {
    return NextResponse.next();
  }

  // Verificar sessão via cookie
  const sessionToken = request.cookies.get("better-auth.session_token");

  if (!sessionToken) {
    // Redirecionar para login
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("callbackUrl", pathname);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    // Proteger todas as rotas exceto arquivos estáticos
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
