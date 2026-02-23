const AUTH_EMAIL_DOMAIN = 'accounts.petlar.local'

export function normalizeUserEmail(email: string): string {
  return email.trim().toLowerCase()
}

async function sha256Hex(input: string): Promise<string> {
  if (!globalThis.crypto?.subtle) {
    throw new Error('Web Crypto API indisponível')
  }

  const payload = new TextEncoder().encode(input)
  const digest = await globalThis.crypto.subtle.digest('SHA-256', payload)

  return Array.from(new Uint8Array(digest))
    .map((value) => value.toString(16).padStart(2, '0'))
    .join('')
}

export async function buildOrgScopedAuthEmail(params: {
  orgId: string
  email: string
}): Promise<string> {
  const normalizedEmail = normalizeUserEmail(params.email)
  const digest = await sha256Hex(`${params.orgId}:${normalizedEmail}`)

  return `${digest}@${AUTH_EMAIL_DOMAIN}`
}
