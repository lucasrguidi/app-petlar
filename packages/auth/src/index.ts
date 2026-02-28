import { db } from '@app-petlar/db'
import * as schema from '@app-petlar/db/schema/auth'
import { env } from '@app-petlar/env/server'
import { betterAuth } from 'better-auth'
import { drizzleAdapter } from 'better-auth/adapters/drizzle'
import { nextCookies } from 'better-auth/next-js'

import { resolveTrustedOrigins } from './trusted-origins'

const PASSWORD_RESET_EXPIRATION_HOURS = 1

function escapeHtml(value: string): string {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;')
}

async function sendPasswordResetEmail(params: {
  to: string
  url: string
  userName?: string
}) {
  if (!env.RESEND_API_KEY || !env.EMAIL_FROM) {
    console.error('Configuração de e-mail não encontrada para reset de senha')
    return
  }

  const safeUserName = params.userName ? escapeHtml(params.userName) : 'usuário'

  const subject = 'Redefinição de senha - PetLar'
  const text = [
    `Olá ${safeUserName},`,
    '',
    'Recebemos uma solicitação para redefinir a senha da sua conta no PetLar.',
    '',
    `Para criar uma nova senha, acesse: ${params.url}`,
    '',
    `Este link expira em ${PASSWORD_RESET_EXPIRATION_HOURS} hora.`,
    '',
    'Se você não solicitou esta redefinição, ignore este e-mail — sua senha não será alterada.',
    '',
    'PetLar - Gestão de Adoções',
  ].join('\n')

  const html = `
    <!doctype html>
    <html lang="pt-BR">
      <head>
        <meta charset="UTF-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <title>Redefinição de senha</title>
      </head>
      <body style="margin:0;padding:0;background:#aec7e2;">
        <span style="display:none!important;visibility:hidden;opacity:0;color:transparent;height:0;width:0;overflow:hidden;">
          Clique para redefinir sua senha no PetLar.
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
                            PETLAR • Segurança
                          </div>
                          <h1 style="margin:14px 0 8px 0;color:#ffffff;font-family:'Outfit','DM Sans',Segoe UI,Arial,sans-serif;font-size:28px;line-height:1.15;font-weight:700;letter-spacing:-0.3px;">
                            Redefinição de senha
                          </h1>
                          <p style="margin:0;color:#fff6ef;font-family:'DM Sans',Segoe UI,Arial,sans-serif;font-size:14px;line-height:1.55;">
                            Clique no botão abaixo para criar uma nova senha.
                          </p>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>

                <tr>
                  <td style="padding:24px;">
                    <p style="margin:0 0 14px 0;color:#783201;font-family:'DM Sans',Segoe UI,Arial,sans-serif;font-size:15px;line-height:1.6;">
                      Olá ${safeUserName},
                    </p>
                    <p style="margin:0 0 16px 0;color:#8b5a2b;font-family:'DM Sans',Segoe UI,Arial,sans-serif;font-size:14px;line-height:1.6;">
                      Recebemos uma solicitação para redefinir a senha da sua conta no PetLar.
                    </p>

                    <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="margin:0 0 16px 0;">
                      <tr>
                        <td align="center">
                          <a href="${params.url}" style="display:inline-block;background:linear-gradient(135deg,#e35915 0%,#f07b3d 100%);color:#ffffff;font-family:'DM Sans',Segoe UI,Arial,sans-serif;font-size:16px;font-weight:600;text-decoration:none;padding:14px 32px;border-radius:12px;box-shadow:0 4px 14px rgba(227,89,21,0.25);">
                            Redefinir minha senha
                          </a>
                        </td>
                      </tr>
                    </table>

                    <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%">
                      <tr>
                        <td style="padding:0;color:#783201;font-family:'DM Sans',Segoe UI,Arial,sans-serif;font-size:14px;line-height:1.55;">
                          ⏱️ Este link expira em <strong>${PASSWORD_RESET_EXPIRATION_HOURS} hora</strong>.
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>

                <tr>
                  <td style="border-top:1px solid #e8f0f8;background:#f8fbff;padding:16px 24px;">
                    <p style="margin:0;color:#8b5a2b;font-family:'DM Sans',Segoe UI,Arial,sans-serif;font-size:12px;line-height:1.6;">
                      Se você não solicitou esta redefinição, ignore este e-mail — sua senha não será alterada.
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
    console.error(`Falha ao enviar e-mail de reset (${response.status}): ${body}`)
  }
}

export const auth = betterAuth({
  database: drizzleAdapter(db, {
    provider: 'sqlite',
    schema: schema,
  }),
  trustedOrigins: resolveTrustedOrigins,
  emailAndPassword: {
    enabled: true,
    minPasswordLength: 6,
    sendResetPassword: async ({ user, url }) => {
      const targetEmail =
        (user as { contactEmail?: string }).contactEmail ?? user.email

      await sendPasswordResetEmail({
        to: targetEmail,
        url,
        userName: user.name,
      })
    },
    resetPasswordTokenExpiresIn: PASSWORD_RESET_EXPIRATION_HOURS * 60 * 60,
  },
  user: {
    additionalFields: {
      orgId: {
        type: 'string',
        required: true,
        input: true,
        fieldName: 'orgId',
      },
      contactEmail: {
        type: 'string',
        required: true,
        input: true,
        fieldName: 'contactEmail',
      },
      contactEmailNormalized: {
        type: 'string',
        required: true,
        input: true,
        fieldName: 'contactEmailNormalized',
      },
      role: {
        type: 'string',
        required: true,
        defaultValue: 'volunteer',
        fieldName: 'role',
      },
      active: {
        type: 'boolean',
        required: false,
        defaultValue: true,
        input: false,
        fieldName: 'active',
      },
    },
  },
  databaseHooks: {
    session: {
      create: {
        before: async (session) => {
          const foundUser = await db.query.user.findFirst({
            columns: { active: true },
            where: (users, { eq }) => eq(users.id, session.userId),
          })

          if (!foundUser || !foundUser.active) {
            return false
          }
        },
      },
    },
  },
  plugins: [nextCookies()],
})

export type Auth = typeof auth
