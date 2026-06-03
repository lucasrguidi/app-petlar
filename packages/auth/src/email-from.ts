import { env } from '@app-petlar/env/server'

/**
 * Build a RFC 5322 "From" header that includes a friendly display name
 * (typically the org name) followed by the verified sender address.
 *
 * Example: formatEmailFrom('Quero Adotar')
 *   -> '"Quero Adotar" <noreply@queroadotar.com>'
 *
 * Falls back to the bare address when no display name is provided.
 */
function escapeQuotedString(value: string): string {
  return value.replaceAll('\\', '\\\\').replaceAll('"', '\\"')
}

export function formatEmailFrom(orgName?: string | null): string {
  const address = env.EMAIL_FROM
  if (!address) {
    throw new Error('EMAIL_FROM is not configured')
  }

  const trimmed = orgName?.trim()
  if (!trimmed) {
    return address
  }

  return `"${escapeQuotedString(trimmed)}" <${address}>`
}
