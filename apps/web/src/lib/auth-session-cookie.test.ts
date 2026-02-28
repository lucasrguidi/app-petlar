import { describe, expect, it } from 'vitest'

import { getAuthSessionTokenFromCookies } from './auth-session-cookie'

function createCookieStore(entries: Record<string, string>) {
  return {
    get(name: string) {
      const value = entries[name]

      if (!value) {
        return undefined
      }

      return { value }
    },
  }
}

describe('auth-session-cookie', () => {
  it('reads the default session cookie name', () => {
    const cookies = createCookieStore({
      'better-auth.session_token': 'plain-token',
    })

    expect(getAuthSessionTokenFromCookies(cookies)).toBe('plain-token')
  })

  it('reads the secure session cookie name used on https', () => {
    const cookies = createCookieStore({
      '__Secure-better-auth.session_token': 'secure-token',
    })

    expect(getAuthSessionTokenFromCookies(cookies)).toBe('secure-token')
  })

  it('returns null when no session cookie is present', () => {
    const cookies = createCookieStore({})

    expect(getAuthSessionTokenFromCookies(cookies)).toBeNull()
  })
})
