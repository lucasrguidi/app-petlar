import { db } from '@app-petlar/db'
import { orgs, sponsors } from '@app-petlar/db/schema'
import { TRPCError } from '@trpc/server'
import { and, asc, desc, eq, sql } from 'drizzle-orm'
import { nanoid } from 'nanoid'
import { z } from 'zod'

import { deleteFile, getKeyFromUrl } from '../lib/r2'
import { adminProcedure, publicProcedure, router } from '../index'

function requireOrgId(user: { orgId?: string | null }): string {
  if (!user.orgId) {
    throw new TRPCError({
      code: 'FORBIDDEN',
      message: 'Usuário não pertence a nenhuma organização',
    })
  }
  return user.orgId
}

export const sponsorsRouter = router({
  listPublic: publicProcedure
    .input(z.object({ slug: z.string().min(1) }))
    .query(async ({ input }) => {
      const [org] = await db
        .select({ id: orgs.id })
        .from(orgs)
        .where(eq(orgs.slug, input.slug))

      if (!org) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Organização não encontrada',
        })
      }

      return db
        .select({
          id: sponsors.id,
          name: sponsors.name,
          logoUrl: sponsors.logoUrl,
          websiteUrl: sponsors.websiteUrl,
          featured: sponsors.featured,
          order: sponsors.order,
        })
        .from(sponsors)
        .where(eq(sponsors.orgId, org.id))
        .orderBy(desc(sponsors.featured), asc(sponsors.order))
    }),

  list: adminProcedure.query(async ({ ctx }) => {
    const orgId = requireOrgId(ctx.session.user)

    return db
      .select({
        id: sponsors.id,
        name: sponsors.name,
        logoUrl: sponsors.logoUrl,
        websiteUrl: sponsors.websiteUrl,
        featured: sponsors.featured,
        order: sponsors.order,
        createdAt: sponsors.createdAt,
      })
      .from(sponsors)
      .where(eq(sponsors.orgId, orgId))
      .orderBy(desc(sponsors.featured), asc(sponsors.order))
  }),

  create: adminProcedure
    .input(
      z.object({
        name: z.string().min(1).max(200),
        logoUrl: z.string().url(),
        websiteUrl: z.string().url(),
        featured: z.boolean().default(false),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const orgId = requireOrgId(ctx.session.user)

      const [maxOrder] = await db
        .select({ max: sql<number>`coalesce(max(${sponsors.order}), 0)` })
        .from(sponsors)
        .where(eq(sponsors.orgId, orgId))

      const id = nanoid()
      await db.insert(sponsors).values({
        id,
        orgId,
        name: input.name,
        logoUrl: input.logoUrl,
        websiteUrl: input.websiteUrl,
        featured: input.featured,
        order: (maxOrder?.max ?? 0) + 1,
      })

      return { id }
    }),

  update: adminProcedure
    .input(
      z.object({
        id: z.string(),
        name: z.string().min(1).max(200).optional(),
        logoUrl: z.string().url().optional(),
        websiteUrl: z.string().url().optional(),
        featured: z.boolean().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const orgId = requireOrgId(ctx.session.user)
      const { id, ...data } = input

      const [existing] = await db
        .select({
          id: sponsors.id,
          logoUrl: sponsors.logoUrl,
          featured: sponsors.featured,
        })
        .from(sponsors)
        .where(and(eq(sponsors.id, id), eq(sponsors.orgId, orgId)))

      if (!existing) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Patrocinador não encontrado',
        })
      }

      // Delete old logo from R2 if logo is being replaced
      if (data.logoUrl && data.logoUrl !== existing.logoUrl) {
        const oldKey = getKeyFromUrl(existing.logoUrl)
        if (oldKey) {
          await deleteFile(oldKey).catch(() => {})
        }
      }

      // If featured status changed, place at end of the new group
      const featuredChanged =
        data.featured !== undefined && data.featured !== existing.featured
      if (featuredChanged) {
        const [maxOrder] = await db
          .select({
            max: sql<number>`coalesce(max(${sponsors.order}), 0)`,
          })
          .from(sponsors)
          .where(eq(sponsors.orgId, orgId))

        await db
          .update(sponsors)
          .set({ ...data, order: (maxOrder?.max ?? 0) + 1 })
          .where(eq(sponsors.id, id))
      } else {
        await db.update(sponsors).set(data).where(eq(sponsors.id, id))
      }

      return { success: true }
    }),

  delete: adminProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const orgId = requireOrgId(ctx.session.user)

      const [existing] = await db
        .select({ id: sponsors.id, logoUrl: sponsors.logoUrl })
        .from(sponsors)
        .where(and(eq(sponsors.id, input.id), eq(sponsors.orgId, orgId)))

      if (!existing) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Patrocinador não encontrado',
        })
      }

      // Delete logo from R2
      const key = getKeyFromUrl(existing.logoUrl)
      if (key) {
        await deleteFile(key).catch(() => {})
      }

      await db.delete(sponsors).where(eq(sponsors.id, input.id))

      return { success: true }
    }),

  reorder: adminProcedure
    .input(
      z.object({
        items: z.array(
          z.object({
            id: z.string(),
            order: z.number().int().min(1),
          })
        ),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const orgId = requireOrgId(ctx.session.user)

      await db.transaction(async (tx) => {
        for (const item of input.items) {
          await tx
            .update(sponsors)
            .set({ order: item.order })
            .where(and(eq(sponsors.id, item.id), eq(sponsors.orgId, orgId)))
        }
      })

      return { success: true }
    }),
})
