'use client'

import { useCallback } from 'react'

const onlyDigitsRegex = /\D/g

function formatBrazilianPhone(value: string): string {
  const digits = value.replace(onlyDigitsRegex, '').slice(0, 11)

  if (digits.length === 0) return ''
  if (digits.length <= 2) return `(${digits}`

  const areaCode = digits.slice(0, 2)
  const number = digits.slice(2)

  if (number.length <= 4) {
    return `(${areaCode}) ${number}`
  }

  if (number.length <= 8) {
    return `(${areaCode}) ${number.slice(0, 4)}-${number.slice(4)}`
  }

  return `(${areaCode}) ${number.slice(0, 5)}-${number.slice(5, 9)}`
}

export function usePhoneMask() {
  const formatPhone = useCallback((value: string) => {
    return formatBrazilianPhone(value)
  }, [])

  const getPhoneDigits = useCallback((value: string) => {
    return value.replace(onlyDigitsRegex, '')
  }, [])

  return {
    formatPhone,
    getPhoneDigits,
  }
}
