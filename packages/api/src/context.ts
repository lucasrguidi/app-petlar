import { auth } from '@app-petlar/auth'
import { touchUserLastSeen } from '@app-petlar/db/user-activity'

import type { NextRequest } from 'next/server'

export async function createContext(req: NextRequest) {
  const session = await auth.api.getSession({
    headers: req.headers,
  })

  if (session?.user?.id) {
    try {
      await touchUserLastSeen(session.user.id)
    } catch {
      // Best effort only.
    }
  }

  return {
    session,
  }
}

export type Context = Awaited<ReturnType<typeof createContext>>
