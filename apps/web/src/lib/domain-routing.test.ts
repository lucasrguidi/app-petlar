import { describe, expect, it } from 'vitest'

import {
  buildCustomDomainEffectivePathname,
  hasOrgSlugPrefix,
} from './domain-routing'

describe('domain-routing', () => {
  describe('hasOrgSlugPrefix', () => {
    it('returns true when the pathname already starts with the org slug', () => {
      expect(hasOrgSlugPrefix('/queroadotar', 'queroadotar')).toBe(true)
      expect(hasOrgSlugPrefix('/queroadotar/login', 'queroadotar')).toBe(true)
    })

    it('returns false for slugless paths', () => {
      expect(hasOrgSlugPrefix('/', 'queroadotar')).toBe(false)
      expect(hasOrgSlugPrefix('/login', 'queroadotar')).toBe(false)
    })
  })

  describe('buildCustomDomainEffectivePathname', () => {
    it('prefixes slugless custom-domain paths internally', () => {
      expect(buildCustomDomainEffectivePathname('/', 'queroadotar')).toBe(
        '/queroadotar/'
      )
      expect(buildCustomDomainEffectivePathname('/login', 'queroadotar')).toBe(
        '/queroadotar/login'
      )
    })

    it('does not duplicate the slug when it is already present', () => {
      expect(
        buildCustomDomainEffectivePathname(
          '/queroadotar/login',
          'queroadotar'
        )
      ).toBe('/queroadotar/login')
    })

    it('does not rewrite api routes', () => {
      expect(
        buildCustomDomainEffectivePathname(
          '/api/auth/sign-in/email',
          'queroadotar'
        )
      ).toBe('/api/auth/sign-in/email')
      expect(buildCustomDomainEffectivePathname('/api/trpc', 'queroadotar')).toBe(
        '/api/trpc'
      )
    })
  })
})
