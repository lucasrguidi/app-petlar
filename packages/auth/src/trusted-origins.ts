import { db } from '@app-petlar/db'
import { env } from '@app-petlar/env/server'

function getDefaultTrustedOrigins(): string[] {
  return [env.CORS_ORIGIN]
}

export async function resolveTrustedOrigins(
  request?: Request
): Promise<string[]> {
  const trustedOrigins = new Set(getDefaultTrustedOrigins())

  if (!request) {
    return [...trustedOrigins]
  }

  let requestUrl: URL

  try {
    requestUrl = new URL(request.url)
  } catch {
    return [...trustedOrigins]
  }

  if (trustedOrigins.has(requestUrl.origin)) {
    return [...trustedOrigins]
  }

  const org = await db.query.orgs.findFirst({
    columns: { id: true },
    where: (table, { eq }) =>
      eq(table.customDomain, requestUrl.hostname.toLowerCase()),
  })

  if (!org) {
    return [...trustedOrigins]
  }

  trustedOrigins.add(requestUrl.origin)

  return [...trustedOrigins]
}
