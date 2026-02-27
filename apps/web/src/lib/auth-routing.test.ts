import { describe, expect, it } from 'vitest'

import {
  buildOrgLoginPathFromRootCallback,
  buildLoginRedirectPathForProtectedRoute,
  isProtectedRoute,
  mapRootAdminCallbackUrlToOrg,
  matchProtectedRoute,
  resolvePostLoginPath,
  sanitizeRootAdminCallbackUrl,
  sanitizeCallbackUrlForOrg,
} from './auth-routing'

describe('auth-routing', () => {
  describe('matchProtectedRoute', () => {
    it('matches root admin route', () => {
      expect(matchProtectedRoute('/admin')).toEqual({ type: 'root-admin' })
      expect(matchProtectedRoute('/admin/usuarios')).toEqual({
        type: 'root-admin',
      })
    })

    it('matches org admin routes', () => {
      expect(matchProtectedRoute('/petlar/admin')).toEqual({
        type: 'org-admin',
        slug: 'petlar',
      })
      expect(matchProtectedRoute('/petlar/admin/gatos')).toEqual({
        type: 'org-admin',
        slug: 'petlar',
      })
    })

    it('does not match public routes', () => {
      expect(matchProtectedRoute('/')).toBeNull()
      expect(matchProtectedRoute('/petlar')).toBeNull()
      expect(matchProtectedRoute('/petlar/login')).toBeNull()
      expect(matchProtectedRoute('/petlar/convite/token')).toBeNull()
      expect(matchProtectedRoute('/api/trpc')).toBeNull()
    })
  })

  describe('isProtectedRoute', () => {
    it('returns true only for admin routes', () => {
      expect(isProtectedRoute('/admin')).toBe(true)
      expect(isProtectedRoute('/petlar/admin/adotados')).toBe(true)

      expect(isProtectedRoute('/petlar')).toBe(false)
      expect(isProtectedRoute('/petlar/login')).toBe(false)
      expect(isProtectedRoute('/petlar/convite/abc')).toBe(false)
    })
  })

  describe('buildLoginRedirectPathForProtectedRoute', () => {
    it('builds redirect for root admin path', () => {
      expect(buildLoginRedirectPathForProtectedRoute('/admin')).toBe(
        '/login?callbackUrl=%2Fadmin'
      )
    })

    it('builds redirect for org admin path preserving query string', () => {
      expect(
        buildLoginRedirectPathForProtectedRoute(
          '/petlar/admin/gatos',
          '?page=2&status=available'
        )
      ).toBe(
        '/petlar/login?callbackUrl=%2Fpetlar%2Fadmin%2Fgatos%3Fpage%3D2%26status%3Davailable'
      )
    })
  })

  describe('sanitizeCallbackUrlForOrg', () => {
    it('accepts same-org admin callbacks and /admin special case', () => {
      expect(sanitizeCallbackUrlForOrg('/petlar/admin', 'petlar')).toBe(
        '/petlar/admin'
      )
      expect(
        sanitizeCallbackUrlForOrg('/petlar/admin/gatos?page=2', 'petlar')
      ).toBe('/petlar/admin/gatos?page=2')
      expect(sanitizeCallbackUrlForOrg('/admin', 'petlar')).toBe('/admin')
    })

    it('rejects invalid callbacks', () => {
      expect(sanitizeCallbackUrlForOrg('https://evil.com', 'petlar')).toBeNull()
      expect(sanitizeCallbackUrlForOrg('//evil.com', 'petlar')).toBeNull()
      expect(sanitizeCallbackUrlForOrg('/outra-org/admin', 'petlar')).toBeNull()
      expect(sanitizeCallbackUrlForOrg('/petlar/login', 'petlar')).toBeNull()
    })
  })

  describe('root login callback helpers', () => {
    it('sanitizes only root admin callbacks', () => {
      expect(sanitizeRootAdminCallbackUrl('/admin')).toBe('/admin')
      expect(sanitizeRootAdminCallbackUrl('/admin/gatos?page=2')).toBe(
        '/admin/gatos?page=2'
      )

      expect(sanitizeRootAdminCallbackUrl('/petlar/admin')).toBeNull()
      expect(sanitizeRootAdminCallbackUrl('https://evil.com')).toBeNull()
    })

    it('maps root admin callback to selected org', () => {
      expect(
        mapRootAdminCallbackUrlToOrg({ slug: 'orgb', callbackUrl: '/admin' })
      ).toBe('/orgb/admin')
      expect(
        mapRootAdminCallbackUrlToOrg({
          slug: 'orgb',
          callbackUrl: '/admin/gatos?page=3',
        })
      ).toBe('/orgb/admin/gatos?page=3')
    })

    it('builds org login path and discards invalid/slugged callback', () => {
      expect(
        buildOrgLoginPathFromRootCallback({
          slug: 'orgb',
          callbackUrl: '/admin/adotados',
        })
      ).toBe('/orgb/login?callbackUrl=%2Forgb%2Fadmin%2Fadotados')

      expect(
        buildOrgLoginPathFromRootCallback({
          slug: 'orgb',
          callbackUrl: '/petlar/admin/gatos',
        })
      ).toBe('/orgb/login')
    })
  })

  describe('resolvePostLoginPath', () => {
    it('falls back to org admin when callback is missing or invalid', () => {
      expect(
        resolvePostLoginPath({ slug: 'petlar', callbackUrl: undefined })
      ).toBe('/petlar/admin')
      expect(
        resolvePostLoginPath({ slug: 'petlar', callbackUrl: '/foo' })
      ).toBe('/petlar/admin')
    })

    it('returns safe callback when valid', () => {
      expect(
        resolvePostLoginPath({
          slug: 'petlar',
          callbackUrl: '/petlar/admin/gatos?page=2',
        })
      ).toBe('/petlar/admin/gatos?page=2')
    })
  })
})
