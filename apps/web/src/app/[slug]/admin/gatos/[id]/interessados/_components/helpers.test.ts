import { describe, expect, it } from 'vitest'

import { getStatusLabel, parseApplicantsFilters } from './helpers'

describe('candidate status helpers', () => {
  it('accepts permanent rejection in URL filters', () => {
    expect(
      parseApplicantsFilters({ status: 'permanently_rejected' }).status
    ).toBe('permanently_rejected')
  })

  it('keeps rejecting unknown status values', () => {
    expect(parseApplicantsFilters({ status: 'blocked' }).status).toBeUndefined()
  })

  it('uses a distinct label for permanent rejection', () => {
    expect(getStatusLabel('permanently_rejected')).toBe('Rejeição permanente')
  })
})
