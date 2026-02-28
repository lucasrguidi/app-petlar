const SESSION_TOKEN_COOKIE_NAMES = [
  'better-auth.session_token',
  '__Secure-better-auth.session_token',
] as const

type CookieStore = {
  get(name: string): { value: string } | undefined
}

export function getAuthSessionTokenFromCookies(
  cookies: CookieStore
): string | null {
  for (const cookieName of SESSION_TOKEN_COOKIE_NAMES) {
    const token = cookies.get(cookieName)?.value

    if (token) {
      return token
    }
  }

  return null
}
