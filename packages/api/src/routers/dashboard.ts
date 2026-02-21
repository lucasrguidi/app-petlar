import { db } from '@app-petlar/db'
import {
  adoptions,
  applications,
  catPhotos,
  cats,
} from '@app-petlar/db/schema'
import { TRPCError } from '@trpc/server'
import { and, count, desc, eq, gte, isNotNull, lt, sql } from 'drizzle-orm'
import { z } from 'zod'

import { protectedProcedure, router } from '../index'

const periodSchema = z.enum(['week', 'month', 'year'])

type Period = z.infer<typeof periodSchema>

interface PeriodRange {
  start: Date
  end: Date
}

/**
 * Calculate date range for a period
 */
function getPeriodRange(period: Period): PeriodRange {
  const now = new Date()
  const end = now

  let start: Date

  if (period === 'week') {
    start = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
  } else if (period === 'month') {
    start = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
  } else {
    start = new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000)
  }

  return { start, end }
}

/**
 * Get orgId from session user, throws if not present
 */
function requireOrgId(user: { orgId?: string | null }): string {
  if (!user.orgId) {
    throw new TRPCError({
      code: 'FORBIDDEN',
      message: 'Usuário não pertence a nenhuma organização',
    })
  }
  return user.orgId
}

export const dashboardRouter = router({
  /**
   * Get dashboard metrics for the organization
   * Stats are always current (not affected by period)
   * Timeline data respects the period parameter
   */
  getMetrics: protectedProcedure
    .input(z.object({ period: periodSchema }))
    .query(async ({ ctx, input }) => {
      const orgId = requireOrgId(ctx.session.user)
      const { start, end } = getPeriodRange(input.period)

      // 1. Available cats count
      const [availableCatsResult] = await db
        .select({ count: count() })
        .from(cats)
        .where(and(eq(cats.orgId, orgId), eq(cats.status, 'available')))

      const availableCatsCount = availableCatsResult?.count ?? 0

      // 2. Pending applications count (confirmed but not processed)
      const [pendingApplicationsResult] = await db
        .select({ count: count() })
        .from(applications)
        .where(
          and(
            eq(applications.orgId, orgId),
            isNotNull(applications.confirmedAt),
            eq(applications.status, 'pending')
          )
        )

      const pendingApplicationsCount = pendingApplicationsResult?.count ?? 0

      // 3. Total adoptions
      const [totalAdoptionsResult] = await db
        .select({ count: count() })
        .from(adoptions)
        .where(eq(adoptions.orgId, orgId))

      const totalAdoptions = totalAdoptionsResult?.count ?? 0

      // 4. Top 3 most sought-after AVAILABLE cats (by confirmed applications)
      const topCatsResult = await db
        .select({
          id: cats.id,
          name: cats.name,
          applicationsCount: count(applications.id),
        })
        .from(cats)
        .leftJoin(
          applications,
          and(
            eq(applications.catId, cats.id),
            isNotNull(applications.confirmedAt)
          )
        )
        .where(and(eq(cats.orgId, orgId), eq(cats.status, 'available')))
        .groupBy(cats.id, cats.name)
        .orderBy(desc(count(applications.id)))
        .limit(3)

      // Get photos for top cats
      const topCatIds = topCatsResult.map((c) => c.id)
      const topCatPhotos =
        topCatIds.length > 0
          ? await db
              .select({
                catId: catPhotos.catId,
                url: catPhotos.url,
                order: catPhotos.order,
              })
              .from(catPhotos)
              .where(sql`${catPhotos.catId} IN ${topCatIds}`)
              .orderBy(catPhotos.catId, catPhotos.order)
          : []

      const photosByCatId = new Map<string, string>()
      for (const photo of topCatPhotos) {
        if (!photosByCatId.has(photo.catId)) {
          photosByCatId.set(photo.catId, photo.url)
        }
      }

      const topCats = topCatsResult
        .filter((cat) => cat.applicationsCount > 0)
        .map((cat) => ({
          id: cat.id,
          name: cat.name,
          photoUrl: photosByCatId.get(cat.id) ?? null,
          applicationsCount: cat.applicationsCount,
        }))

      // 5. Timeline data (respects period)
      const timeline = await buildTimeline(orgId, input.period, start, end)

      // 6. Recent activity (last 5 events)
      const recentActivity = await getRecentActivity(orgId)

      return {
        availableCatsCount,
        pendingApplicationsCount,
        totalAdoptions,
        topCats,
        timeline,
        recentActivity,
      }
    }),
})

/**
 * Build timeline data based on period
 */
async function buildTimeline(
  orgId: string,
  period: Period,
  start: Date,
  end: Date
): Promise<Array<{ date: string; applications: number; adoptions: number }>> {
  // Determine bucket format based on period
  let bucketFormat: string

  if (period === 'week') {
    // Daily buckets for last 7 days
    bucketFormat = '%Y-%m-%d'
  } else if (period === 'month') {
    // Weekly buckets for last 4 weeks
    bucketFormat = '%Y-W%W'
  } else {
    // Monthly buckets for last 12 months
    bucketFormat = '%Y-%m'
  }

  // Get applications grouped by bucket
  const applicationsTimeline = await db
    .select({
      bucket: sql<string>`strftime(${bucketFormat}, datetime(${applications.confirmedAt} / 1000, 'unixepoch'))`,
      count: count(),
    })
    .from(applications)
    .where(
      and(
        eq(applications.orgId, orgId),
        isNotNull(applications.confirmedAt),
        gte(applications.confirmedAt, start),
        lt(applications.confirmedAt, end)
      )
    )
    .groupBy(
      sql`strftime(${bucketFormat}, datetime(${applications.confirmedAt} / 1000, 'unixepoch'))`
    )

  // Get adoptions grouped by bucket
  const adoptionsTimeline = await db
    .select({
      bucket: sql<string>`strftime(${bucketFormat}, datetime(${adoptions.createdAt} / 1000, 'unixepoch'))`,
      count: count(),
    })
    .from(adoptions)
    .where(
      and(
        eq(adoptions.orgId, orgId),
        gte(adoptions.createdAt, start),
        lt(adoptions.createdAt, end)
      )
    )
    .groupBy(
      sql`strftime(${bucketFormat}, datetime(${adoptions.createdAt} / 1000, 'unixepoch'))`
    )

  // Build bucket dates
  const buckets: string[] = []
  const now = new Date()

  if (period === 'week') {
    for (let i = 6; i >= 0; i--) {
      const date = new Date(now.getTime() - i * 24 * 60 * 60 * 1000)
      buckets.push(date.toISOString().split('T')[0]!)
    }
  } else if (period === 'month') {
    // Last 4 complete weeks + current partial week
    for (let i = 3; i >= 0; i--) {
      const date = new Date(now.getTime() - i * 7 * 24 * 60 * 60 * 1000)
      const year = date.getFullYear()
      const week = getWeekNumber(date)
      buckets.push(`${year}-W${week.toString().padStart(2, '0')}`)
    }
  } else {
    // Last 12 months
    for (let i = 11; i >= 0; i--) {
      const date = new Date(now.getFullYear(), now.getMonth() - i, 1)
      const year = date.getFullYear()
      const month = (date.getMonth() + 1).toString().padStart(2, '0')
      buckets.push(`${year}-${month}`)
    }
  }

  // Create maps for quick lookup
  const applicationsMap = new Map<string, number>()
  for (const row of applicationsTimeline) {
    if (row.bucket) {
      applicationsMap.set(row.bucket, row.count)
    }
  }

  const adoptionsMap = new Map<string, number>()
  for (const row of adoptionsTimeline) {
    if (row.bucket) {
      adoptionsMap.set(row.bucket, row.count)
    }
  }

  // Build final timeline
  return buckets.map((bucket) => ({
    date: bucket,
    applications: applicationsMap.get(bucket) ?? 0,
    adoptions: adoptionsMap.get(bucket) ?? 0,
  }))
}

/**
 * Get week number of the year
 */
function getWeekNumber(date: Date): number {
  const d = new Date(
    Date.UTC(date.getFullYear(), date.getMonth(), date.getDate())
  )
  const dayNum = d.getUTCDay() || 7
  d.setUTCDate(d.getUTCDate() + 4 - dayNum)
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1))
  return Math.ceil(((d.getTime() - yearStart.getTime()) / 86400000 + 1) / 7)
}

export type ActivityType = 'adoption' | 'application' | 'new_cat'

export interface RecentActivityItem {
  type: ActivityType
  message: string
  catName: string
  catPhotoUrl: string | null
  timestamp: Date
}

/**
 * Get recent activity for the organization
 */
async function getRecentActivity(orgId: string): Promise<RecentActivityItem[]> {
  // Get recent adoptions
  const recentAdoptions = await db
    .select({
      type: sql<ActivityType>`'adoption'`,
      catId: cats.id,
      catName: cats.name,
      adopterName: adoptions.adopterName,
      timestamp: adoptions.createdAt,
    })
    .from(adoptions)
    .innerJoin(cats, eq(adoptions.catId, cats.id))
    .where(eq(adoptions.orgId, orgId))
    .orderBy(desc(adoptions.createdAt))
    .limit(5)

  // Get recent confirmed applications
  const recentApplications = await db
    .select({
      type: sql<ActivityType>`'application'`,
      catId: cats.id,
      catName: cats.name,
      applicantName: applications.applicantName,
      timestamp: applications.confirmedAt,
    })
    .from(applications)
    .innerJoin(cats, eq(applications.catId, cats.id))
    .where(and(eq(applications.orgId, orgId), isNotNull(applications.confirmedAt)))
    .orderBy(desc(applications.confirmedAt))
    .limit(5)

  // Get recently added cats
  const recentCats = await db
    .select({
      type: sql<ActivityType>`'new_cat'`,
      catId: cats.id,
      catName: cats.name,
      timestamp: cats.createdAt,
    })
    .from(cats)
    .where(eq(cats.orgId, orgId))
    .orderBy(desc(cats.createdAt))
    .limit(5)

  // Combine and sort all activities
  const allActivities = [
    ...recentAdoptions.map((a) => ({
      type: 'adoption' as const,
      catId: a.catId,
      catName: a.catName,
      message: `${a.catName} foi adotado(a) por ${a.adopterName}!`,
      timestamp: a.timestamp,
    })),
    ...recentApplications.map((a) => ({
      type: 'application' as const,
      catId: a.catId,
      catName: a.catName,
      message: `Nova candidatura de ${a.applicantName} para ${a.catName}`,
      timestamp: a.timestamp!,
    })),
    ...recentCats.map((c) => ({
      type: 'new_cat' as const,
      catId: c.catId,
      catName: c.catName,
      message: `${c.catName} foi cadastrado(a) no sistema`,
      timestamp: c.timestamp,
    })),
  ]

  // Sort by timestamp descending and take top 5
  allActivities.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
  const topActivities = allActivities.slice(0, 5)

  // Get photos for all cats in activities
  const catIds = [...new Set(topActivities.map((a) => a.catId))]
  const photosResult =
    catIds.length > 0
      ? await db
          .select({
            catId: catPhotos.catId,
            url: catPhotos.url,
            order: catPhotos.order,
          })
          .from(catPhotos)
          .where(sql`${catPhotos.catId} IN ${catIds}`)
          .orderBy(catPhotos.catId, catPhotos.order)
      : []

  const photosByCatId = new Map<string, string>()
  for (const photo of photosResult) {
    if (!photosByCatId.has(photo.catId)) {
      photosByCatId.set(photo.catId, photo.url)
    }
  }

  return topActivities.map((activity) => ({
    type: activity.type,
    message: activity.message,
    catName: activity.catName,
    catPhotoUrl: photosByCatId.get(activity.catId) ?? null,
    timestamp: activity.timestamp,
  }))
}
