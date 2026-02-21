import { type Route } from 'next'
import { redirect } from 'next/navigation'

import { getSessionAdminPath } from '@/lib/server-auth'

/**
 * Resolve o destino de /admin sem slug.
 * Sem sessão válida, envia para o hub de login com callback.
 */
export default async function AdminRedirectPage() {
  const adminPath = await getSessionAdminPath()

  if (adminPath) {
    redirect(adminPath as Route)
  }

  redirect('/login?callbackUrl=/admin' as Route)
}
