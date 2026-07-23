import { describe, expect, it } from 'vitest'

import {
  catFormSchema,
  getCatFormDefaultValues,
} from './cat-form-schema'

describe('getCatFormDefaultValues', () => {
  it('keeps optional donor fields valid when initial data omits them', () => {
    const values = getCatFormDefaultValues({
      name: 'Lua',
      ageYears: 2,
      ageMonths: 3,
      sex: 'female',
      fiv: 'negative',
      felv: 'negative',
      castrated: true,
      vaccinated: true,
      vaccinationNotes: null,
      dewormed: true,
      dewormingNotes: null,
      description: 'Calma e carinhosa',
      formId: 'form_123',
      donorWhatsapp: undefined,
    })

    expect(values.donorName).toBeNull()
    expect(values.donorWhatsapp).toBeNull()
    expect(catFormSchema.safeParse(values).success).toBe(true)
  })
})
