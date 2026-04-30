import { headers } from 'next/headers'

import { isMainDomain } from './main-domains'

export async function getIsCustomDomain(): Promise<boolean> {
  const headersList = await headers()
  const host = headersList.get('host') ?? ''
  return !isMainDomain(host)
}
