import { db } from '@app-petlar/db'
import { invites, orgs, session, user } from '@app-petlar/db/schema'
import { env } from '@app-petlar/env/server'
import { TRPCError } from '@trpc/server'
import { and, count, desc, eq, isNull, ne, or, sql } from 'drizzle-orm'
import { nanoid } from 'nanoid'
import { z } from 'zod'

import { adminProcedure, protectedProcedure, publicProcedure, router } from '../index'

const INVITE_EXPIRATION_HOURS = 48

function escapeHtml(value: string): string {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;')
}

function getInviteExpiryDate(nowMs = Date.now()): Date {
  return new Date(nowMs + INVITE_EXPIRATION_HOURS * 60 * 60 * 1000)
}

function requireOrgId(userSession: { orgId?: string | null }): string {
  if (!userSession.orgId) {
    throw new TRPCError({
      code: 'FORBIDDEN',
      message: 'Usuário não pertence a nenhuma organização',
    })
  }
  return userSession.orgId
}

async function ensureAtLeastOneAdmin(
  orgId: string,
  excludeUserId?: string
): Promise<void> {
  const conditions = [
    eq(user.orgId, orgId),
    eq(user.role, 'admin'),
    eq(user.active, true),
  ]

  if (excludeUserId) {
    conditions.push(ne(user.id, excludeUserId))
  }

  const [result] = await db
    .select({ count: count() })
    .from(user)
    .where(and(...conditions))

  if ((result?.count ?? 0) < 1) {
    throw new TRPCError({
      code: 'FORBIDDEN',
      message: 'A organização precisa ter pelo menos 1 administrador ativo.',
    })
  }
}

async function sendInviteEmail(params: {
  to: string
  orgName: string
  inviterName: string
  role: string
  inviteUrl: string
}) {
  if (!env.RESEND_API_KEY || !env.EMAIL_FROM) {
    throw new Error('Configuração de e-mail não encontrada')
  }

  const safeOrgName = escapeHtml(params.orgName)
  const safeInviterName = escapeHtml(params.inviterName)
  const safeRole = params.role === 'admin' ? 'Administrador' : 'Voluntário'

  const subject = `Convite para a equipe ${params.orgName} no PetLar`
  const text = [
    `Olá!`,
    '',
    `${params.inviterName} convidou você para fazer parte da equipe de ${params.orgName} no PetLar.`,
    `Seu papel será: ${safeRole}`,
    '',
    `Para aceitar o convite, acesse: ${params.inviteUrl}`,
    '',
    `Este convite expira em ${INVITE_EXPIRATION_HOURS} horas.`,
    '',
    'Se você não esperava este convite, ignore este e-mail.',
  ].join('\n')

  const html = `
    <!doctype html>
    <html lang="pt-BR">
      <head>
        <meta charset="UTF-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <title>Convite para a equipe</title>
      </head>
      <body style="margin:0;padding:0;background:#aec7e2;">
        <span style="display:none!important;visibility:hidden;opacity:0;color:transparent;height:0;width:0;overflow:hidden;">
          ${safeInviterName} convidou você para a equipe ${safeOrgName} no PetLar.
        </span>

        <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%">
          <tr>
            <td align="center" style="padding:24px 12px;">
              <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="max-width:560px;background:#ffffff;border:1px solid #9ab4d1;border-radius:22px;overflow:hidden;">
                <tr>
                  <td style="padding:0;">
                    <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="background:linear-gradient(135deg,#e35915 0%,#f07b3d 100%);">
                      <tr>
                        <td style="padding:22px 24px 18px 24px;">
                          <div style="display:inline-block;background:rgba(255,255,255,0.2);border:1px solid rgba(255,255,255,0.45);border-radius:999px;padding:6px 10px;color:#ffffff;font-family:'DM Sans',Segoe UI,Arial,sans-serif;font-size:12px;font-weight:700;letter-spacing:0.3px;">
                            PETLAR • Convite
                          </div>
                          <h1 style="margin:14px 0 8px 0;color:#ffffff;font-family:'Outfit','DM Sans',Segoe UI,Arial,sans-serif;font-size:28px;line-height:1.15;font-weight:700;letter-spacing:-0.3px;">
                            Você foi convidado para a equipe!
                          </h1>
                          <p style="margin:0;color:#fff6ef;font-family:'DM Sans',Segoe UI,Arial,sans-serif;font-size:14px;line-height:1.55;">
                            <strong>${safeOrgName}</strong> quer você na equipe como <strong>${safeRole}</strong>.
                          </p>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>

                <tr>
                  <td style="padding:24px;">
                    <p style="margin:0 0 14px 0;color:#783201;font-family:'DM Sans',Segoe UI,Arial,sans-serif;font-size:15px;line-height:1.6;">
                      Olá!
                    </p>
                    <p style="margin:0 0 16px 0;color:#8b5a2b;font-family:'DM Sans',Segoe UI,Arial,sans-serif;font-size:14px;line-height:1.6;">
                      <strong>${safeInviterName}</strong> convidou você para fazer parte da equipe de <strong>${safeOrgName}</strong> no PetLar.
                    </p>

                    <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="margin:0 0 16px 0;">
                      <tr>
                        <td style="border:1px solid #f7b58d;background:#fff7ed;border-radius:16px;padding:14px 16px;text-align:center;">
                          <p style="margin:0 0 6px 0;color:#8b5a2b;font-family:'DM Sans',Segoe UI,Arial,sans-serif;font-size:12px;font-weight:700;letter-spacing:0.35px;text-transform:uppercase;">
                            Seu papel
                          </p>
                          <p style="margin:0;color:#e35915;font-family:'DM Sans',Segoe UI,Arial,sans-serif;font-size:20px;line-height:1.1;font-weight:700;">
                            ${safeRole}
                          </p>
                        </td>
                      </tr>
                    </table>

                    <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="margin:0 0 16px 0;">
                      <tr>
                        <td align="center">
                          <a href="${params.inviteUrl}" style="display:inline-block;background:linear-gradient(135deg,#e35915 0%,#f07b3d 100%);color:#ffffff;font-family:'DM Sans',Segoe UI,Arial,sans-serif;font-size:16px;font-weight:600;text-decoration:none;padding:14px 32px;border-radius:12px;box-shadow:0 4px 14px rgba(227,89,21,0.25);">
                            Aceitar convite
                          </a>
                        </td>
                      </tr>
                    </table>

                    <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%">
                      <tr>
                        <td style="padding:0;color:#783201;font-family:'DM Sans',Segoe UI,Arial,sans-serif;font-size:14px;line-height:1.55;">
                          ⏱️ Este convite expira em <strong>${INVITE_EXPIRATION_HOURS} horas</strong>.
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>

                <tr>
                  <td style="border-top:1px solid #e8f0f8;background:#f8fbff;padding:16px 24px;">
                    <p style="margin:0;color:#8b5a2b;font-family:'DM Sans',Segoe UI,Arial,sans-serif;font-size:12px;line-height:1.6;">
                      Se você não esperava este convite, ignore este e-mail com segurança.
                    </p>
                  </td>
                </tr>
              </table>

              <p style="margin:12px 0 0 0;color:#6f4f35;font-family:'DM Sans',Segoe UI,Arial,sans-serif;font-size:11px;line-height:1.4;">
                PetLar • Sistema de adoção responsável
              </p>
            </td>
          </tr>
        </table>
      </body>
    </html>
  `

  const response = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${env.RESEND_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from: env.EMAIL_FROM,
      to: [params.to],
      subject,
      text,
      html,
    }),
  })

  if (!response.ok) {
    const body = await response.text()
    throw new Error(`Falha ao enviar e-mail (${response.status}): ${body}`)
  }
}

const listUsersSchema = z.object({
  search: z.string().trim().max(200).optional(),
  page: z.number().int().min(1).default(1),
  limit: z.number().int().min(1).max(50).default(15),
  includeInactive: z.boolean().default(false),
})

const updateRoleSchema = z.object({
  userId: z.string().min(1),
  role: z.enum(['admin', 'volunteer']),
})

const deactivateSchema = z.object({
  userId: z.string().min(1),
})

const inviteSchema = z.object({
  email: z.string().email('Email inválido'),
  role: z.enum(['admin', 'volunteer']).default('volunteer'),
})

const listInvitesSchema = z.object({
  page: z.number().int().min(1).default(1),
  limit: z.number().int().min(1).max(50).default(10),
})

const cancelInviteSchema = z.object({
  inviteId: z.string().min(1),
})

const resendInviteSchema = z.object({
  inviteId: z.string().min(1),
})

const validateInviteSchema = z.object({
  token: z.string().min(1),
  slug: z.string().min(1),
})

const acceptInviteSchema = z.object({
  token: z.string().min(1),
  name: z.string().min(1, 'Nome é obrigatório').max(200),
  password: z.string().min(6, 'Senha deve ter pelo menos 6 caracteres'),
})

export const usersRouter = router({
  updateLastLogin: protectedProcedure.mutation(async ({ ctx }) => {
    const now = new Date()

    await db
      .update(user)
      .set({ lastLoginAt: now, lastSeenAt: now })
      .where(eq(user.id, ctx.session.user.id))

    return { success: true }
  }),

  list: adminProcedure.input(listUsersSchema).query(async ({ ctx, input }) => {
    const orgId = requireOrgId(ctx.session.user)
    const offset = (input.page - 1) * input.limit

    const conditions = input.includeInactive
      ? [eq(user.orgId, orgId)]
      : [eq(user.orgId, orgId), eq(user.active, true)]

    if (input.search) {
      const searchLower = input.search.toLowerCase()
      conditions.push(
        or(
          sql`lower(${user.name}) like ${`%${searchLower}%`}`,
          sql`lower(${user.email}) like ${`%${searchLower}%`}`
        )!
      )
    }

    const [countResult] = await db
      .select({ count: count() })
      .from(user)
      .where(and(...conditions))

    const users = await db
      .select({
        id: user.id,
        name: user.name,
        email: user.email,
        image: user.image,
        role: user.role,
        active: user.active,
        lastSeenAt: user.lastSeenAt,
        createdAt: user.createdAt,
      })
      .from(user)
      .where(and(...conditions))
      .orderBy(desc(user.createdAt))
      .limit(input.limit)
      .offset(offset)

    const total = countResult?.count ?? 0

    return {
      users,
      currentUserId: ctx.session.user.id,
      pagination: {
        page: input.page,
        limit: input.limit,
        total,
        totalPages: Math.ceil(total / input.limit),
      },
    }
  }),

  updateRole: adminProcedure
    .input(updateRoleSchema)
    .mutation(async ({ ctx, input }) => {
      const orgId = requireOrgId(ctx.session.user)

      if (input.userId === ctx.session.user.id) {
        throw new TRPCError({
          code: 'FORBIDDEN',
          message: 'Você não pode alterar seu próprio papel.',
        })
      }

      const [targetUser] = await db
        .select({ id: user.id, role: user.role, active: user.active })
        .from(user)
        .where(and(eq(user.id, input.userId), eq(user.orgId, orgId)))
        .limit(1)

      if (!targetUser || !targetUser.active) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Usuário não encontrado.',
        })
      }

      if (targetUser.role === 'admin' && input.role === 'volunteer') {
        await ensureAtLeastOneAdmin(orgId, input.userId)
      }

      await db.update(user).set({ role: input.role }).where(eq(user.id, input.userId))

      return { success: true }
    }),

  deactivate: adminProcedure
    .input(deactivateSchema)
    .mutation(async ({ ctx, input }) => {
      const orgId = requireOrgId(ctx.session.user)

      if (input.userId === ctx.session.user.id) {
        throw new TRPCError({
          code: 'FORBIDDEN',
          message: 'Você não pode desativar a si mesmo.',
        })
      }

      const [targetUser] = await db
        .select({ id: user.id, role: user.role, active: user.active })
        .from(user)
        .where(and(eq(user.id, input.userId), eq(user.orgId, orgId)))
        .limit(1)

      if (!targetUser || !targetUser.active) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Usuário não encontrado.',
        })
      }

      if (targetUser.role === 'admin') {
        await ensureAtLeastOneAdmin(orgId, input.userId)
      }

      await db.transaction(async (tx) => {
        await tx.update(user).set({ active: false }).where(eq(user.id, input.userId))
        await tx.delete(session).where(eq(session.userId, input.userId))
      })

      return { success: true }
    }),

  reactivate: adminProcedure
    .input(z.object({ userId: z.string().min(1) }))
    .mutation(async ({ ctx, input }) => {
      const orgId = requireOrgId(ctx.session.user)

      const [targetUser] = await db
        .select({ id: user.id, active: user.active })
        .from(user)
        .where(and(eq(user.id, input.userId), eq(user.orgId, orgId)))
        .limit(1)

      if (!targetUser) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Usuário não encontrado.',
        })
      }

      if (targetUser.active) {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: 'Este usuário já está ativo.',
        })
      }

      await db.update(user).set({ active: true }).where(eq(user.id, input.userId))

      return { success: true }
    }),

  invite: adminProcedure.input(inviteSchema).mutation(async ({ ctx, input }) => {
    const orgId = requireOrgId(ctx.session.user)
    const normalizedEmail = input.email.trim().toLowerCase()

    // Check for active user first
    const [existingActiveUser] = await db
      .select({ id: user.id })
      .from(user)
      .where(
        and(
          eq(user.orgId, orgId),
          sql`lower(${user.email}) = ${normalizedEmail}`,
          eq(user.active, true)
        )
      )
      .limit(1)

    if (existingActiveUser) {
      throw new TRPCError({
        code: 'CONFLICT',
        message: 'Já existe um usuário com este e-mail na organização.',
      })
    }

    // Check for deactivated user
    const [deactivatedUser] = await db
      .select({ id: user.id, name: user.name })
      .from(user)
      .where(
        and(
          eq(user.orgId, orgId),
          sql`lower(${user.email}) = ${normalizedEmail}`,
          eq(user.active, false)
        )
      )
      .limit(1)

    if (deactivatedUser) {
      throw new TRPCError({
        code: 'CONFLICT',
        message: JSON.stringify({
          type: 'DEACTIVATED_USER',
          userId: deactivatedUser.id,
          userName: deactivatedUser.name,
        }),
      })
    }

    const [existingInvite] = await db
      .select({ id: invites.id })
      .from(invites)
      .where(
        and(
          eq(invites.orgId, orgId),
          sql`lower(${invites.email}) = ${normalizedEmail}`,
          isNull(invites.usedAt),
          sql`${invites.expiresAt} > ${Date.now()}`
        )
      )
      .limit(1)

    if (existingInvite) {
      throw new TRPCError({
        code: 'CONFLICT',
        message: 'Já existe um convite pendente para este e-mail.',
      })
    }

    const [org] = await db
      .select({ name: orgs.name, slug: orgs.slug })
      .from(orgs)
      .where(eq(orgs.id, orgId))
      .limit(1)

    if (!org) {
      throw new TRPCError({
        code: 'NOT_FOUND',
        message: 'Organização não encontrada.',
      })
    }

    const token = nanoid(32)
    const inviteId = nanoid()
    const expiresAt = getInviteExpiryDate()

    await db.insert(invites).values({
      id: inviteId,
      orgId,
      email: normalizedEmail,
      role: input.role,
      token,
      expiresAt,
      invitedById: ctx.session.user.id,
    })

    const baseUrl = env.CORS_ORIGIN || 'http://localhost:3001'
    const inviteUrl = `${baseUrl}/${org.slug}/convite/${token}`

    try {
      await sendInviteEmail({
        to: normalizedEmail,
        orgName: org.name,
        inviterName: ctx.session.user.name ?? 'Administrador',
        role: input.role,
        inviteUrl,
      })
    } catch (error) {
      console.error('Erro ao enviar e-mail de convite:', error)
      await db.delete(invites).where(eq(invites.id, inviteId))
      throw new TRPCError({
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Não foi possível enviar o e-mail de convite.',
      })
    }

    return { success: true, inviteId }
  }),

  listInvites: adminProcedure
    .input(listInvitesSchema)
    .query(async ({ ctx, input }) => {
      const orgId = requireOrgId(ctx.session.user)
      const offset = (input.page - 1) * input.limit
      const now = Date.now()

      const [countResult] = await db
        .select({ count: count() })
        .from(invites)
        .where(
          and(
            eq(invites.orgId, orgId),
            isNull(invites.usedAt),
            sql`${invites.expiresAt} > ${now}`
          )
        )

      const pendingInvites = await db
        .select({
          id: invites.id,
          email: invites.email,
          role: invites.role,
          expiresAt: invites.expiresAt,
          createdAt: invites.createdAt,
          invitedByName: user.name,
        })
        .from(invites)
        .innerJoin(user, eq(user.id, invites.invitedById))
        .where(
          and(
            eq(invites.orgId, orgId),
            isNull(invites.usedAt),
            sql`${invites.expiresAt} > ${now}`
          )
        )
        .orderBy(desc(invites.createdAt))
        .limit(input.limit)
        .offset(offset)

      const total = countResult?.count ?? 0

      return {
        invites: pendingInvites,
        pagination: {
          page: input.page,
          limit: input.limit,
          total,
          totalPages: Math.ceil(total / input.limit),
        },
      }
    }),

  cancelInvite: adminProcedure
    .input(cancelInviteSchema)
    .mutation(async ({ ctx, input }) => {
      const orgId = requireOrgId(ctx.session.user)

      const [invite] = await db
        .select({ id: invites.id })
        .from(invites)
        .where(
          and(
            eq(invites.id, input.inviteId),
            eq(invites.orgId, orgId),
            isNull(invites.usedAt)
          )
        )
        .limit(1)

      if (!invite) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Convite não encontrado.',
        })
      }

      await db.delete(invites).where(eq(invites.id, input.inviteId))

      return { success: true }
    }),

  resendInvite: adminProcedure
    .input(resendInviteSchema)
    .mutation(async ({ ctx, input }) => {
      const orgId = requireOrgId(ctx.session.user)

      const [invite] = await db
        .select({
          id: invites.id,
          email: invites.email,
          role: invites.role,
        })
        .from(invites)
        .where(
          and(
            eq(invites.id, input.inviteId),
            eq(invites.orgId, orgId),
            isNull(invites.usedAt)
          )
        )
        .limit(1)

      if (!invite) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Convite não encontrado.',
        })
      }

      const [org] = await db
        .select({ name: orgs.name, slug: orgs.slug })
        .from(orgs)
        .where(eq(orgs.id, orgId))
        .limit(1)

      if (!org) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Organização não encontrada.',
        })
      }

      const newToken = nanoid(32)
      const newExpiresAt = getInviteExpiryDate()

      await db
        .update(invites)
        .set({
          token: newToken,
          expiresAt: newExpiresAt,
          invitedById: ctx.session.user.id,
        })
        .where(eq(invites.id, input.inviteId))

      const baseUrl = env.CORS_ORIGIN || 'http://localhost:3001'
      const inviteUrl = `${baseUrl}/${org.slug}/convite/${newToken}`

      try {
        await sendInviteEmail({
          to: invite.email,
          orgName: org.name,
          inviterName: ctx.session.user.name ?? 'Administrador',
          role: invite.role,
          inviteUrl,
        })
      } catch (error) {
        console.error('Erro ao reenviar e-mail de convite:', error)
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Não foi possível reenviar o e-mail de convite.',
        })
      }

      return { success: true }
    }),

  validateInvite: publicProcedure
    .input(validateInviteSchema)
    .query(async ({ input }) => {
      const [org] = await db
        .select({ id: orgs.id, name: orgs.name })
        .from(orgs)
        .where(eq(orgs.slug, input.slug))
        .limit(1)

      if (!org) {
        return { valid: false, reason: 'org_not_found' as const }
      }

      const [invite] = await db
        .select({
          id: invites.id,
          email: invites.email,
          role: invites.role,
          expiresAt: invites.expiresAt,
          usedAt: invites.usedAt,
        })
        .from(invites)
        .where(and(eq(invites.token, input.token), eq(invites.orgId, org.id)))
        .limit(1)

      if (!invite) {
        return { valid: false, reason: 'invite_not_found' as const }
      }

      if (invite.usedAt) {
        return { valid: false, reason: 'already_used' as const }
      }

      if (invite.expiresAt.getTime() < Date.now()) {
        return { valid: false, reason: 'expired' as const }
      }

      return {
        valid: true,
        invite: {
          email: invite.email,
          role: invite.role,
          orgName: org.name,
        },
      }
    }),

  acceptInvite: publicProcedure
    .input(acceptInviteSchema)
    .mutation(async ({ input }) => {
      const [invite] = await db
        .select({
          id: invites.id,
          orgId: invites.orgId,
          email: invites.email,
          role: invites.role,
          expiresAt: invites.expiresAt,
          usedAt: invites.usedAt,
        })
        .from(invites)
        .where(eq(invites.token, input.token))
        .limit(1)

      if (!invite) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Convite não encontrado.',
        })
      }

      if (invite.usedAt) {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: 'Este convite já foi utilizado.',
        })
      }

      if (invite.expiresAt.getTime() < Date.now()) {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: 'Este convite expirou.',
        })
      }

      const [existingUser] = await db
        .select({ id: user.id })
        .from(user)
        .where(sql`lower(${user.email}) = ${invite.email.toLowerCase()}`)
        .limit(1)

      if (existingUser) {
        throw new TRPCError({
          code: 'CONFLICT',
          message: 'Já existe uma conta com este e-mail.',
        })
      }

      const { auth } = await import('@app-petlar/auth')

      const response = await auth.api.signUpEmail({
        body: {
          email: invite.email,
          password: input.password,
          name: input.name,
        },
      })

      if (!response?.user?.id) {
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Erro ao criar conta.',
        })
      }

      await db
        .update(user)
        .set({
          orgId: invite.orgId,
          role: invite.role,
          emailVerified: true,
          active: true,
        })
        .where(eq(user.id, response.user.id))

      await db
        .update(invites)
        .set({ usedAt: new Date() })
        .where(eq(invites.id, invite.id))

      return { success: true, userId: response.user.id }
    }),
})
