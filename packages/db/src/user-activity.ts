import { and, eq, isNull, lte, or } from 'drizzle-orm'

import { user } from './schema'

import { db } from './index'

const LAST_SEEN_THROTTLE_MS = 5 * 60 * 1000

export async function touchUserLastSeen(
  userId: string,
  now: Date = new Date()
): Promise<void> {
  const threshold = new Date(now.getTime() - LAST_SEEN_THROTTLE_MS)

  await db
    .update(user)
    .set({ lastSeenAt: now })
    .where(
      and(
        eq(user.id, userId),
        or(isNull(user.lastSeenAt), lte(user.lastSeenAt, threshold))
      )
    )
}
