const MAIN_DOMAINS = [
  'localhost',
  '127.0.0.1',
  'petlar.com',
  'www.petlar.com',
  'petlar.vercel.app',
  'app-petlar-web.vercel.app',
]

export function isMainDomain(hostname: string): boolean {
  const cleanHost = hostname.split(':')[0]?.toLowerCase() ?? ''
  return MAIN_DOMAINS.some(
    (domain) => cleanHost === domain || cleanHost.endsWith(`.${domain}`)
  )
}
