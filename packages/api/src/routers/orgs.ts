import { db } from '@app-petlar/db'
import { orgs } from '@app-petlar/db/schema'
import { TRPCError } from '@trpc/server'
import { and, eq, ne } from 'drizzle-orm'
import { z } from 'zod'

import { adminProcedure, publicProcedure, router } from '../index'

/**
 * Validates that a hex color is in the format #RRGGBB.
 */
const hexColorSchema = z
  .string()
  .regex(/^#[0-9a-fA-F]{6}$/, 'Formato de cor inválido. Use #RRGGBB')
  .nullable()

/**
 * Schema for updating org theme settings.
 */
const updateThemeSchema = z.object({
  primaryColor: hexColorSchema,
  primaryForegroundColor: hexColorSchema,
  secondaryColor: hexColorSchema,
  secondaryForegroundColor: hexColorSchema,
  backgroundColor: hexColorSchema,
  foregroundColor: hexColorSchema,
  accentColor: hexColorSchema,
  mutedColor: hexColorSchema,
  mutedForegroundColor: hexColorSchema,
})

/**
 * Schema for updating org custom domain.
 */
const updateCustomDomainSchema = z.object({
  customDomain: z
    .string()
    .trim()
    .toLowerCase()
    .regex(
      /^(?:[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?\.)+[a-z]{2,}$/,
      'Domínio inválido'
    )
    .nullable(),
})

function requireOrgId(userSession: { orgId?: string | null }): string {
  if (!userSession.orgId) {
    throw new TRPCError({
      code: 'FORBIDDEN',
      message: 'Usuário não pertence a nenhuma organização',
    })
  }
  return userSession.orgId
}

export const orgsRouter = router({
  /**
   * Busca org por slug (público, usado na página de login)
   */
  getBySlug: publicProcedure
    .input(z.object({ slug: z.string() }))
    .query(async ({ input }) => {
      const [org] = await db
        .select({
          id: orgs.id,
          name: orgs.name,
          slug: orgs.slug,
          logoUrl: orgs.logoUrl,
        })
        .from(orgs)
        .where(eq(orgs.slug, input.slug))

      return org ?? null
    }),

  /**
   * Get org settings for admin configuration page.
   */
  getSettings: adminProcedure.query(async ({ ctx }) => {
    const orgId = requireOrgId(ctx.session.user)

    const [org] = await db
      .select({
        id: orgs.id,
        name: orgs.name,
        slug: orgs.slug,
        logoUrl: orgs.logoUrl,
        customDomain: orgs.customDomain,
        primaryColor: orgs.primaryColor,
        primaryForegroundColor: orgs.primaryForegroundColor,
        secondaryColor: orgs.secondaryColor,
        secondaryForegroundColor: orgs.secondaryForegroundColor,
        backgroundColor: orgs.backgroundColor,
        foregroundColor: orgs.foregroundColor,
        accentColor: orgs.accentColor,
        mutedColor: orgs.mutedColor,
        mutedForegroundColor: orgs.mutedForegroundColor,
      })
      .from(orgs)
      .where(eq(orgs.id, orgId))
      .limit(1)

    if (!org) {
      throw new TRPCError({
        code: 'NOT_FOUND',
        message: 'Organização não encontrada',
      })
    }

    return org
  }),

  /**
   * Update org theme colors.
   */
  updateTheme: adminProcedure
    .input(updateThemeSchema)
    .mutation(async ({ ctx, input }) => {
      const orgId = requireOrgId(ctx.session.user)

      await db
        .update(orgs)
        .set({
          primaryColor: input.primaryColor,
          primaryForegroundColor: input.primaryForegroundColor,
          secondaryColor: input.secondaryColor,
          secondaryForegroundColor: input.secondaryForegroundColor,
          backgroundColor: input.backgroundColor,
          foregroundColor: input.foregroundColor,
          accentColor: input.accentColor,
          mutedColor: input.mutedColor,
          mutedForegroundColor: input.mutedForegroundColor,
        })
        .where(eq(orgs.id, orgId))

      return { success: true }
    }),

  /**
   * Update org custom domain.
   */
  updateCustomDomain: adminProcedure
    .input(updateCustomDomainSchema)
    .mutation(async ({ ctx, input }) => {
      const orgId = requireOrgId(ctx.session.user)

      // Check if domain is already in use by another org
      if (input.customDomain) {
        const [existing] = await db
          .select({ id: orgs.id })
          .from(orgs)
          .where(
            and(
              eq(orgs.customDomain, input.customDomain),
              ne(orgs.id, orgId)
            )
          )
          .limit(1)

        if (existing) {
          throw new TRPCError({
            code: 'CONFLICT',
            message: 'Este domínio já está em uso por outra organização',
          })
        }
      }

      await db
        .update(orgs)
        .set({
          customDomain: input.customDomain,
        })
        .where(eq(orgs.id, orgId))

      return { success: true }
    }),
})
