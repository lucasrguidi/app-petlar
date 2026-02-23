import { createHash } from 'node:crypto'

export const AUTH_EMAIL_DOMAIN = 'accounts.petlar.local'

export function normalizeUserEmail(email: string): string {
  return email.trim().toLowerCase()
}

export function buildOrgScopedAuthEmail(params: {
  orgId: string
  email: string
}): string {
  const normalizedEmail = normalizeUserEmail(params.email)
  const digest = createHash('sha256')
    .update(`${params.orgId}:${normalizedEmail}`)
    .digest('hex')

  return `${digest}@${AUTH_EMAIL_DOMAIN}`
}
