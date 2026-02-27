import { auth } from '@app-petlar/auth'
import { db } from '@app-petlar/db'
import { orgs, user } from '@app-petlar/db/schema'
import { eq } from 'drizzle-orm'
import { headers } from 'next/headers'
import { cache } from 'react'

export type ActiveSessionUser = {
  id: string
  orgId: string
  orgSlug: string
  role: 'admin' | 'volunteer'
}

const getSession = cache(async () => {
  return auth.api.getSession({ headers: await headers() })
})

export const getActiveSessionUser = cache(
  async (): Promise<ActiveSessionUser | null> => {
    const session = await getSession()

    if (!session?.user?.id) {
      return null
    }

    const [currentUser] = await db
      .select({
        id: user.id,
        orgId: user.orgId,
        role: user.role,
        active: user.active,
        orgSlug: orgs.slug,
      })
      .from(user)
      .leftJoin(orgs, eq(user.orgId, orgs.id))
      .where(eq(user.id, session.user.id))
      .limit(1)

    if (
      !currentUser ||
      !currentUser.active ||
      !currentUser.orgId ||
      !currentUser.orgSlug
    ) {
      return null
    }

    return {
      id: currentUser.id,
      orgId: currentUser.orgId,
      orgSlug: currentUser.orgSlug,
      role: currentUser.role,
    }
  }
)

export async function getSessionAdminPath(): Promise<string | null> {
  const currentUser = await getActiveSessionUser()

  if (!currentUser) {
    return null
  }

  return `/${currentUser.orgSlug}/admin`
}
