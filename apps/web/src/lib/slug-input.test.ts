import { describe, expect, it } from 'vitest'

import {
  extractSlugFromInput,
  isValidSlugFormat,
  normalizeSlugInput,
} from './slug-input'

describe('slug-input', () => {
  describe('normalizeSlugInput', () => {
    it('trims and normalizes to lowercase', () => {
      expect(normalizeSlugInput('  PetLar  ')).toBe('petlar')
    })
  })

  describe('extractSlugFromInput', () => {
    it('extracts slug from plain slug', () => {
      expect(extractSlugFromInput('petlar')).toBe('petlar')
    })

    it('extracts slug from path-style input', () => {
      expect(extractSlugFromInput(' /PetLar/ ')).toBe('petlar')
    })

    it('extracts slug from full URL', () => {
      expect(extractSlugFromInput('https://app.petlar.com/PetLar/login')).toBe(
        'petlar'
      )
    })

    it('extracts slug from URL without protocol when prefixed with www', () => {
      expect(extractSlugFromInput('www.petlar.com/PetLar/admin')).toBe('petlar')
    })

    it('returns null for empty or unusable values', () => {
      expect(extractSlugFromInput('')).toBeNull()
      expect(extractSlugFromInput('   ')).toBeNull()
      expect(extractSlugFromInput('/')).toBeNull()
      expect(extractSlugFromInput('https://app.petlar.com')).toBeNull()
      expect(extractSlugFromInput('https://[invalid-url')).toBeNull()
    })
  })

  describe('isValidSlugFormat', () => {
    it('accepts only lowercase letters, numbers and hyphen', () => {
      expect(isValidSlugFormat('petlar')).toBe(true)
      expect(isValidSlugFormat('petlar-01')).toBe(true)
    })

    it('rejects invalid slug formats', () => {
      expect(isValidSlugFormat('pet lar')).toBe(false)
      expect(isValidSlugFormat('pet_lar')).toBe(false)
      expect(isValidSlugFormat('petlar/admin')).toBe(false)
      expect(isValidSlugFormat('')).toBe(false)
    })
  })
})
