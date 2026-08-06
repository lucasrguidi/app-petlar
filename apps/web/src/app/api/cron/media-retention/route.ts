import { timingSafeEqual } from 'node:crypto'

import {
  purgeLosingApplications,
  reconcileOrphans,
} from '@app-petlar/api/lib/media-retention'
import { env } from '@app-petlar/env/server'
import { NextResponse, type NextRequest } from 'next/server'

// Reconciliation lists the whole bucket, so give it room.
export const maxDuration = 300

const notFound = () =>
  NextResponse.json({ message: 'Not found' }, { status: 404 })

function isAuthorized(request: NextRequest): boolean {
  const secret = env.CRON_SECRET
  if (!secret) return false

  const provided = request.headers.get('authorization')
  if (!provided) return false

  const expected = `Bearer ${secret}`
  const providedBuffer = Buffer.from(provided)
  const expectedBuffer = Buffer.from(expected)

  if (providedBuffer.length !== expectedBuffer.length) return false
  return timingSafeEqual(providedBuffer, expectedBuffer)
}

export async function GET(request: NextRequest) {
  if (!isAuthorized(request)) {
    return notFound()
  }

  try {
    const purged = await purgeLosingApplications()
    const orphans = await reconcileOrphans({
      dryRun: !env.RETENTION_DELETE_ORPHANS,
    })

    // Surfaced in the Vercel logs so the dry-run output can be reviewed before
    // the destructive mode is enabled.
    console.warn('[retention] concluído', { purged, orphans })

    return NextResponse.json({ purged, orphans })
  } catch (error) {
    console.error('[retention] falhou', error)
    return NextResponse.json(
      { message: 'Falha na rotina de retenção' },
      { status: 500 }
    )
  }
}
