import { db } from '@app-petlar/db'
import {
  adoptions,
  applicationFiles,
  applications,
  catGroupPhotos,
  catPhotos,
  sponsors,
} from '@app-petlar/db/schema'
import { and, eq, inArray, isNull, lte, ne, type SQL } from 'drizzle-orm'

import { deleteFiles, getKeyFromUrl, listAllObjects } from './r2'
import { retentionCutoffDate } from './retention-window'

/**
 * Objects newer than this are never treated as orphans: a presigned URL is
 * valid for an hour and the object exists in R2 before any DB row references
 * it, so a short window would delete uploads that are still in flight.
 */
const ORPHAN_GRACE_HOURS = 24

/**
 * Delete applications along with their media.
 *
 * R2 objects are removed first (best-effort, mirroring
 * `cleanupExpiredPendingApplications`), then the rows — `application_files`
 * goes with them via ON DELETE CASCADE.
 */
export async function deleteApplicationsWithMedia(
  applicationIds: string[]
): Promise<{ applications: number; files: number; bytes: number }> {
  if (applicationIds.length === 0) {
    return { applications: 0, files: 0, bytes: 0 }
  }

  const files = await db
    .select({
      url: applicationFiles.url,
      sizeBytes: applicationFiles.sizeBytes,
    })
    .from(applicationFiles)
    .where(inArray(applicationFiles.applicationId, applicationIds))

  const keys = files
    .map((file) => getKeyFromUrl(file.url))
    .filter((key): key is string => key !== null)

  if (keys.length > 0) {
    try {
      await deleteFiles(keys)
    } catch (error) {
      // Losing the objects is recoverable (reconcileOrphans sweeps them later);
      // blocking the row deletion is not worth it.
      console.error('Erro ao remover mídias de candidaturas', { error })
    }
  }

  await db.delete(applications).where(inArray(applications.id, applicationIds))

  return {
    applications: applicationIds.length,
    files: files.length,
    bytes: files.reduce((total, file) => total + (file.sizeBytes ?? 0), 0),
  }
}

/** Matches applications belonging to a group, or to a single cat. */
function applicationsForTarget(catId: string, groupId: string | null): SQL {
  return groupId
    ? eq(applications.groupId, groupId)
    : eq(applications.catId, catId)
}

/**
 * Purge the losing applications of every cat adopted more than
 * ADOPTION_RETENTION_DAYS ago.
 *
 * The adopter's own application is preserved so the interview answers behind
 * the adoption stay auditable. A direct adoption has no linked application, so
 * nothing is preserved in that case. The adopter's *contact* data lives on the
 * `adoptions` row itself and is never touched here.
 */
export async function purgeLosingApplications(now = new Date()) {
  const cutoff = retentionCutoffDate(now)

  const due = await db
    .select({
      id: adoptions.id,
      catId: adoptions.catId,
      groupId: adoptions.groupId,
      applicationId: adoptions.applicationId,
    })
    .from(adoptions)
    .where(
      and(
        lte(adoptions.adoptionDate, cutoff),
        isNull(adoptions.applicationsPurgedAt)
      )
    )

  if (due.length === 0) {
    return { adoptions: 0, applications: 0, files: 0, bytes: 0 }
  }

  // A group adoption inserts one row per cat sharing the same groupId and
  // applicationId — collapse those so the group is processed once.
  const targets = new Map<
    string,
    { catId: string; groupId: string | null; keepApplicationId: string | null }
  >()

  for (const adoption of due) {
    const key = adoption.groupId ?? `cat:${adoption.catId}`
    if (targets.has(key)) continue
    targets.set(key, {
      catId: adoption.catId,
      groupId: adoption.groupId,
      keepApplicationId: adoption.applicationId,
    })
  }

  const totals = { applications: 0, files: 0, bytes: 0 }

  for (const target of targets.values()) {
    const conditions: SQL[] = [
      applicationsForTarget(target.catId, target.groupId),
    ]

    if (target.keepApplicationId) {
      conditions.push(ne(applications.id, target.keepApplicationId))
    }

    const losing = await db
      .select({ id: applications.id })
      .from(applications)
      .where(and(...conditions))

    const result = await deleteApplicationsWithMedia(
      losing.map((application) => application.id)
    )

    totals.applications += result.applications
    totals.files += result.files
    totals.bytes += result.bytes
  }

  await db
    .update(adoptions)
    .set({ applicationsPurgedAt: now })
    .where(
      inArray(
        adoptions.id,
        due.map((adoption) => adoption.id)
      )
    )

  return { adoptions: due.length, ...totals }
}

/**
 * Delete every application of a cat/group, including the adopter's.
 *
 * Used when a cat is returned after the retention window: the losing
 * applications are already gone, and the adopter is no longer relevant, so the
 * cat goes back to the public list with an empty candidate list.
 */
export async function wipeAllCatApplications(
  catId: string,
  groupId: string | null
) {
  const rows = await db
    .select({ id: applications.id })
    .from(applications)
    .where(applicationsForTarget(catId, groupId))

  return deleteApplicationsWithMedia(rows.map((row) => row.id))
}

const MANAGED_PREFIXES = [
  'applications/',
  'cats/',
  'adoption-terms/',
  'sponsors/',
]

/** Every R2 key currently referenced by a row in the database. */
async function collectKeysInUse(): Promise<Set<string>> {
  const [files, photos, groupPhotos, terms, logos] = await Promise.all([
    db.select({ url: applicationFiles.url }).from(applicationFiles),
    db.select({ url: catPhotos.url }).from(catPhotos),
    db.select({ url: catGroupPhotos.url }).from(catGroupPhotos),
    db.select({ url: adoptions.adoptionTermUrl }).from(adoptions),
    db.select({ url: sponsors.logoUrl }).from(sponsors),
  ])

  const keys = new Set<string>()

  for (const row of [...files, ...photos, ...groupPhotos, ...terms, ...logos]) {
    if (!row.url) continue
    const key = getKeyFromUrl(row.url)
    if (key) keys.add(key)
  }

  return keys
}

/**
 * Remove R2 objects no row points at — uploads abandoned before submit, and
 * media orphaned by cascade deletes.
 *
 * Defaults to a dry run: this is the only routine here that can destroy live
 * media if the in-use set is derived incorrectly, so the destructive mode is
 * opt-in and should only be enabled after reviewing the logged output.
 */
export async function reconcileOrphans({ dryRun = true } = {}) {
  const inUse = await collectKeysInUse()
  const graceThreshold = new Date(
    Date.now() - ORPHAN_GRACE_HOURS * 60 * 60 * 1000
  )

  const orphans: { key: string; size: number }[] = []

  for (const prefix of MANAGED_PREFIXES) {
    const objects = await listAllObjects(prefix)

    for (const object of objects) {
      if (inUse.has(object.key)) continue
      // Skip anything that could still be mid-upload.
      if (!object.lastModified || object.lastModified > graceThreshold) continue
      orphans.push({ key: object.key, size: object.size })
    }
  }

  const bytes = orphans.reduce((total, orphan) => total + orphan.size, 0)

  if (orphans.length > 0) {
    console.warn(
      `[retention] ${orphans.length} objeto(s) órfão(s), ${bytes} bytes${
        dryRun ? ' (dry run, nada removido)' : ''
      }`,
      orphans.slice(0, 50).map((orphan) => orphan.key)
    )
  }

  if (!dryRun && orphans.length > 0) {
    await deleteFiles(orphans.map((orphan) => orphan.key))
  }

  return { dryRun, orphans: orphans.length, bytes }
}
