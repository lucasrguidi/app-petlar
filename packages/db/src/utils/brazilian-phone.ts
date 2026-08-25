/**
 * Validation for Brazilian phone numbers used across the applicant flow.
 *
 * Kept as a shared utility so client-side form validation and the tRPC
 * schema on the server enforce the exact same rules — otherwise a value
 * that passes the browser hits the server and gets rejected with a
 * generic error, or worse, is accepted and pollutes the applications
 * table.
 */

const VALID_DDDS = new Set([
  11, 12, 13, 14, 15, 16, 17, 18, 19,
  21, 22, 24, 27, 28,
  31, 32, 33, 34, 35, 37, 38,
  41, 42, 43, 44, 45, 46, 47, 48, 49,
  51, 53, 54, 55,
  61, 62, 63, 64, 65, 66, 67, 68, 69,
  71, 73, 74, 75, 77, 79,
  81, 82, 83, 84, 85, 86, 87, 88, 89,
  91, 92, 93, 94, 95, 96, 97, 98, 99,
])

export function getBrazilianPhoneDigits(value: string): string {
  return value.replace(/\D/g, '')
}

/**
 * Detects trivially fake inputs — all the same digit ("99999999999") or a
 * simple ascending/descending run ("12345678901"). Real numbers with runs
 * are extremely rare and the false-positive risk is worth catching lazy
 * fakes at zero cost.
 */
function isTrivialSequence(digits: string): boolean {
  if (/^(\d)\1+$/.test(digits)) return true

  let ascending = true
  let descending = true
  for (let i = 1; i < digits.length; i++) {
    const prev = digits.charCodeAt(i - 1)
    const curr = digits.charCodeAt(i)
    if (curr - prev !== 1) ascending = false
    if (prev - curr !== 1) descending = false
    if (!ascending && !descending) return false
  }
  return ascending || descending
}

export function isValidBrazilianPhone(value: string): boolean {
  const digits = getBrazilianPhoneDigits(value)

  if (digits.length !== 10 && digits.length !== 11) return false

  const ddd = Number(digits.slice(0, 2))
  if (!VALID_DDDS.has(ddd)) return false

  const firstDigit = digits[2]

  if (digits.length === 11) {
    // Cell phones must start with 9 after the "nono dígito" reform.
    if (firstDigit !== '9') return false
  } else {
    // Landlines use 2-5 as the first digit; 6-8 were never assigned to
    // fixed lines and 9/0 are reserved for cell / operator codes.
    if (!firstDigit || firstDigit < '2' || firstDigit > '5') return false
  }

  if (isTrivialSequence(digits)) return false

  return true
}

export const BRAZILIAN_PHONE_ERROR =
  'Digite um WhatsApp válido com DDD, ex: (11) 91234-5678'
