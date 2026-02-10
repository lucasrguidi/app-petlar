import { db } from '@app-petlar/db'
import { orgs } from '@app-petlar/db/schema'
import { eq } from 'drizzle-orm'
import { z } from 'zod'

import { publicProcedure, router } from '../index'

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
})
