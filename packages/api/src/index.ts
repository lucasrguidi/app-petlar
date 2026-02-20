import { db } from '@app-petlar/db'
import { user } from '@app-petlar/db/schema'
import { initTRPC, TRPCError } from '@trpc/server'
import { eq } from 'drizzle-orm'

import type { Context } from './context'

export const t = initTRPC.context<Context>().create()

export const router = t.router

export const publicProcedure = t.procedure

export const protectedProcedure = t.procedure.use(async ({ ctx, next }) => {
  if (!ctx.session) {
    throw new TRPCError({
      code: 'UNAUTHORIZED',
      message: 'Authentication required',
      cause: 'No session',
    })
  }

  const [currentUser] = await db
    .select({ active: user.active })
    .from(user)
    .where(eq(user.id, ctx.session.user.id))
    .limit(1)

  if (!currentUser || !currentUser.active) {
    throw new TRPCError({
      code: 'UNAUTHORIZED',
      message: 'Sessão inválida para este usuário',
      cause: 'Inactive user',
    })
  }

  return next({
    ctx: {
      ...ctx,
      session: ctx.session,
    },
  })
})

export const adminProcedure = protectedProcedure.use(({ ctx, next }) => {
  if (ctx.session.user.role !== 'admin') {
    throw new TRPCError({
      code: 'FORBIDDEN',
      message: 'Acesso restrito a administradores',
    })
  }
  return next({ ctx })
})
