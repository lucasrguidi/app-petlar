import { createHash, randomInt, timingSafeEqual } from 'node:crypto'

import { db } from '@app-petlar/db'
import {
  applicationFiles,
  applications,
  applicationStatuses,
  catPhotos,
  cats,
  type CatFormFieldSnapshot,
  formFields,
  type FormFieldMediaConfig,
  type FormFieldType,
  forms,
  orgs,
  type FormFieldCondition,
} from '@app-petlar/db/schema'
import { formatEmailFrom } from '@app-petlar/auth/email-from'
import { env } from '@app-petlar/env/server'
import { TRPCError } from '@trpc/server'
import {
  and,
  asc,
  desc,
  eq,
  inArray,
  isNull,
  lt,
  sql,
  type SQL,
} from 'drizzle-orm'
import { nanoid } from 'nanoid'
import { z } from 'zod'

import { protectedProcedure, publicProcedure, router } from '../index'
import {
  deleteFile,
  generateApplicationFileKey,
  getKeyFromUrl,
  getPresignedUploadUrl,
  getPublicUrl,
} from '../lib/r2'

const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp']
const ALLOWED_VIDEO_TYPES = ['video/mp4', 'video/quicktime', 'video/webm']
const ALLOWED_CONTENT_TYPES = [...ALLOWED_IMAGE_TYPES, ...ALLOWED_VIDEO_TYPES]

const MAX_IMAGE_SIZE = 5 * 1024 * 1024 // 5MB
const MAX_VIDEO_SIZE = 50 * 1024 * 1024 // 50MB

const CONFIRMATION_CODE_LENGTH = 6
const CONFIRMATION_CODE_EXPIRATION_MINUTES = 30
const RESEND_COOLDOWN_SECONDS = 60
const MAX_RESEND_ATTEMPTS = 3
const PENDING_APPLICATION_TTL_HOURS = 48

type ApplicationResponsesRecord = Record<string, string | boolean | null>
type JsonPrimitive = string | boolean

interface ApplicationFormField {
  id: string
  type: FormFieldType
  label: string
  required: boolean
  helpText: string | null
  options: string[] | null
  condition: FormFieldCondition | null
  mediaConfig: FormFieldMediaConfig | null
  order: number
}

const createApplicationSchema = z.object({
  slug: z.string().min(1),
  catId: z.string().min(1),
  applicantName: z.string().min(1, 'Nome é obrigatório').max(200),
  applicantEmail: z.string().email('Email inválido'),
  applicantWhatsapp: z.string().min(10, 'WhatsApp inválido').max(20),
  responses: z.record(z.string(), z.union([z.string(), z.boolean(), z.null()])),
  files: z
    .array(
      z.object({
        fieldId: z.string(),
        url: z.string().url(),
        fileType: z.enum(['image', 'video']),
      })
    )
    .optional(),
  lgpdConsent: z.literal(true, {
    message: 'Você precisa aceitar o compartilhamento de dados',
  }),
  whatsappConsent: z.literal(true, {
    message: 'Você precisa aceitar o contato via WhatsApp',
  }),
})

const confirmCodeSchema = z.object({
  confirmationToken: z.string().min(1),
  code: z
    .string()
    .trim()
    .regex(/^\d{6}$/, 'Código deve conter 6 dígitos'),
})

const resendCodeSchema = z.object({
  confirmationToken: z.string().min(1),
})

const dynamicFilterOperatorSchema = z.enum([
  'contains',
  'equals',
  'before',
  'after',
])

const listByCatSchema = z.object({
  catId: z.string().min(1),
  status: z.enum(applicationStatuses).optional(),
  search: z.string().trim().max(200).optional(),
  page: z.number().int().min(1).default(1),
  limit: z.number().int().min(1).max(50).default(15),
  dynamicFilters: z
    .array(
      z.object({
        fieldId: z.string().min(1),
        operator: dynamicFilterOperatorSchema,
        value: z.union([z.string(), z.boolean()]),
      })
    )
    .max(30)
    .optional(),
})

const getByIdSchema = z.object({
  id: z.string().min(1),
})

const updateStatusSchema = z.object({
  id: z.string().min(1),
  status: z.enum(applicationStatuses),
})

function hasResponseValue(value: string | boolean | null | undefined): boolean {
  if (typeof value === 'string') {
    return value.trim().length > 0
  }

  return value !== null && value !== undefined
}

function isFieldVisible(
  field: { condition: FormFieldCondition | null },
  responses: ApplicationResponsesRecord
): boolean {
  if (!field.condition) return true

  const parentValue = responses[field.condition.fieldId]
  if (parentValue === undefined || parentValue === null || parentValue === '') {
    return false
  }

  return parentValue === field.condition.value
}

function normalizeSearchText(value: string): string {
  return value
    .trim()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
}

function normalizeSqlText(value: SQL): SQL {
  const lowered = sql`lower(coalesce(cast(${value} as text), ''))`

  return sql`replace(replace(replace(replace(replace(replace(replace(replace(replace(replace(replace(replace(replace(replace(replace(replace(replace(replace(replace(replace(replace(replace(replace(replace(${lowered}, 'á', 'a'), 'à', 'a'), 'â', 'a'), 'ã', 'a'), 'ä', 'a'), 'é', 'e'), 'è', 'e'), 'ê', 'e'), 'ë', 'e'), 'í', 'i'), 'ì', 'i'), 'î', 'i'), 'ï', 'i'), 'ó', 'o'), 'ò', 'o'), 'ô', 'o'), 'õ', 'o'), 'ö', 'o'), 'ú', 'u'), 'ù', 'u'), 'û', 'u'), 'ü', 'u'), 'ç', 'c'), 'ñ', 'n')`
}

function normalizeEmail(email: string): string {
  return email.trim().toLowerCase()
}

function toJsonPath(fieldId: string): string {
  return `$."${fieldId.replaceAll('"', '\\"')}"`
}

function generateConfirmationCode(): string {
  const max = 10 ** CONFIRMATION_CODE_LENGTH
  return randomInt(0, max).toString().padStart(CONFIRMATION_CODE_LENGTH, '0')
}

function hashConfirmationCode(code: string, token: string): string {
  return createHash('sha256')
    .update(`${token}:${code}:${env.BETTER_AUTH_SECRET}`)
    .digest('hex')
}

function isCodeHashValid(expectedHash: string, providedHash: string): boolean {
  const expectedBuffer = Buffer.from(expectedHash)
  const providedBuffer = Buffer.from(providedHash)

  if (expectedBuffer.length !== providedBuffer.length) {
    return false
  }

  return timingSafeEqual(expectedBuffer, providedBuffer)
}

function escapeHtml(value: string): string {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;')
}

async function sendApplicationConfirmedEmail(params: {
  to: string
  applicantName: string
  catName: string
  catSex: 'male' | 'female'
  orgName: string
}) {
  if (!env.RESEND_API_KEY || !env.EMAIL_FROM) {
    throw new Error('Configuração de e-mail não encontrada')
  }

  const safeApplicantName = escapeHtml(params.applicantName)
  const safeCatName = escapeHtml(params.catName)
  const safeOrgName = escapeHtml(params.orgName)
  const catArticle = params.catSex === 'female' ? 'a' : 'o'

  const subject = `Candidatura confirmada para ${params.catName}!`
  const text = [
    `Olá, ${params.applicantName}!`,
    '',
    `Sua candidatura para adoção d${catArticle} ${params.catName} foi confirmada com sucesso!`,
    '',
    'E agora?',
    `- A equipe da ${params.orgName} vai analisar sua candidatura com carinho`,
    '- Caso seja aprovado, entraremos em contato via WhatsApp ou e-mail',
    '- Fique de olho nas suas mensagens!',
    '',
    'Obrigado por escolher adotar!',
  ].join('\n')

  const html = `
    <!doctype html>
    <html lang="pt-BR">
      <head>
        <meta charset="UTF-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <title>Candidatura confirmada</title>
      </head>
      <body style="margin:0;padding:0;background:#aec7e2;">
        <span style="display:none!important;visibility:hidden;opacity:0;color:transparent;height:0;width:0;overflow:hidden;">
          Sua candidatura para adoção d${catArticle} ${safeCatName} foi confirmada!
        </span>

        <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%">
          <tr>
            <td align="center" style="padding:24px 12px;">
              <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="max-width:560px;background:#ffffff;border:1px solid #9ab4d1;border-radius:22px;overflow:hidden;">
                <tr>
                  <td style="padding:0;">
                    <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="background:linear-gradient(135deg,#10b981 0%,#34d399 100%);">
                      <tr>
                        <td style="padding:22px 24px 18px 24px;">
                          <div style="display:inline-block;background:rgba(255,255,255,0.2);border:1px solid rgba(255,255,255,0.45);border-radius:999px;padding:6px 10px;color:#ffffff;font-family:'DM Sans',Segoe UI,Arial,sans-serif;font-size:12px;font-weight:700;letter-spacing:0.3px;">
                            PETLAR • Candidatura Confirmada
                          </div>
                          <h1 style="margin:14px 0 8px 0;color:#ffffff;font-family:'Outfit','DM Sans',Segoe UI,Arial,sans-serif;font-size:28px;line-height:1.15;font-weight:700;letter-spacing:-0.3px;">
                            Candidatura enviada!
                          </h1>
                          <p style="margin:0;color:#ecfdf5;font-family:'DM Sans',Segoe UI,Arial,sans-serif;font-size:14px;line-height:1.55;">
                            Sua candidatura para adoção d${catArticle} <strong>${safeCatName}</strong> foi confirmada.
                          </p>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>

                <tr>
                  <td style="padding:24px;">
                    <p style="margin:0 0 14px 0;color:#783201;font-family:'DM Sans',Segoe UI,Arial,sans-serif;font-size:15px;line-height:1.6;">
                      Olá, <strong>${safeApplicantName}</strong>!
                    </p>
                    <p style="margin:0 0 16px 0;color:#8b5a2b;font-family:'DM Sans',Segoe UI,Arial,sans-serif;font-size:14px;line-height:1.6;">
                      Recebemos sua candidatura com sucesso. Agora é só aguardar — a equipe da <strong>${safeOrgName}</strong> vai analisar tudo com carinho e atenção.
                    </p>

                    <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="margin:0 0 16px 0;">
                      <tr>
                        <td style="border:1px solid #a7f3d0;background:#ecfdf5;border-radius:16px;padding:16px;">
                          <p style="margin:0 0 10px 0;color:#065f46;font-family:'DM Sans',Segoe UI,Arial,sans-serif;font-size:13px;font-weight:700;letter-spacing:0.35px;text-transform:uppercase;">
                            Próximos passos
                          </p>
                          <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%">
                            <tr>
                              <td style="padding:6px 0;color:#047857;font-family:'DM Sans',Segoe UI,Arial,sans-serif;font-size:14px;line-height:1.5;">
                                📋 A equipe vai avaliar sua candidatura
                              </td>
                            </tr>
                            <tr>
                              <td style="padding:6px 0;color:#047857;font-family:'DM Sans',Segoe UI,Arial,sans-serif;font-size:14px;line-height:1.5;">
                                📱 Caso seja aprovado, entraremos em contato via WhatsApp ou e-mail
                              </td>
                            </tr>
                            <tr>
                              <td style="padding:6px 0;color:#047857;font-family:'DM Sans',Segoe UI,Arial,sans-serif;font-size:14px;line-height:1.5;">
                                ⏳ Fique de olho nas suas mensagens!
                              </td>
                            </tr>
                          </table>
                        </td>
                      </tr>
                    </table>

                    <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%">
                      <tr>
                        <td style="padding:0;color:#8b5a2b;font-family:'DM Sans',Segoe UI,Arial,sans-serif;font-size:13px;line-height:1.55;">
                          ❤️ <strong>Obrigado por escolher adotar!</strong> Cada candidatura é um passo importante para dar um lar a quem precisa.
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>

                <tr>
                  <td style="border-top:1px solid #e8f0f8;background:#f8fbff;padding:16px 24px;">
                    <p style="margin:0;color:#8b5a2b;font-family:'DM Sans',Segoe UI,Arial,sans-serif;font-size:12px;line-height:1.6;">
                      Este é um e-mail automático. Se tiver dúvidas, entre em contato com a ${safeOrgName}.
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
      from: formatEmailFrom(params.orgName),
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

async function sendApplicationConfirmationEmail(params: {
  to: string
  applicantName: string
  catName: string
  orgName: string
  code: string
}) {
  if (!env.RESEND_API_KEY || !env.EMAIL_FROM) {
    throw new Error('Configuração de e-mail não encontrada')
  }

  const safeApplicantName = escapeHtml(params.applicantName)
  const safeCatName = escapeHtml(params.catName)
  const safeOrgName = escapeHtml(params.orgName)
  const safeCode = escapeHtml(params.code)

  const subject = `Confirme sua candidatura para adoção de ${params.catName}`
  const text = [
    `Olá, ${params.applicantName}!`,
    '',
    `Você iniciou uma candidatura para adoção de ${params.catName} na ${params.orgName}.`,
    `Seu código de confirmação é: ${params.code}`,
    '',
    `Esse código expira em ${CONFIRMATION_CODE_EXPIRATION_MINUTES} minutos.`,
    'Digite o código no formulário para concluir sua candidatura.',
    '',
    'Se você não solicitou essa candidatura, ignore este e-mail.',
  ].join('\n')

  const html = `
    <!doctype html>
    <html lang="pt-BR">
      <head>
        <meta charset="UTF-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <title>Confirmação de candidatura</title>
      </head>
      <body style="margin:0;padding:0;background:#aec7e2;">
        <span style="display:none!important;visibility:hidden;opacity:0;color:transparent;height:0;width:0;overflow:hidden;">
          Seu código de confirmação da candidatura de ${safeCatName} é ${safeCode}.
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
                            PETLAR • Candidatura
                          </div>
                          <h1 style="margin:14px 0 8px 0;color:#ffffff;font-family:'Outfit','DM Sans',Segoe UI,Arial,sans-serif;font-size:28px;line-height:1.15;font-weight:700;letter-spacing:-0.3px;">
                            Confirme sua candidatura
                          </h1>
                          <p style="margin:0;color:#fff6ef;font-family:'DM Sans',Segoe UI,Arial,sans-serif;font-size:14px;line-height:1.55;">
                            Você iniciou a candidatura para adoção de <strong>${safeCatName}</strong> na <strong>${safeOrgName}</strong>.
                          </p>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>

                <tr>
                  <td style="padding:24px;">
                    <p style="margin:0 0 14px 0;color:#783201;font-family:'DM Sans',Segoe UI,Arial,sans-serif;font-size:15px;line-height:1.6;">
                      Olá, <strong>${safeApplicantName}</strong>!
                    </p>
                    <p style="margin:0 0 16px 0;color:#8b5a2b;font-family:'DM Sans',Segoe UI,Arial,sans-serif;font-size:14px;line-height:1.6;">
                      Digite este código no formulário para concluir a confirmação da sua candidatura:
                    </p>

                    <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="margin:0 0 16px 0;">
                      <tr>
                        <td style="border:1px solid #f7b58d;background:#fff7ed;border-radius:16px;padding:14px 16px;text-align:center;">
                          <p style="margin:0 0 6px 0;color:#8b5a2b;font-family:'DM Sans',Segoe UI,Arial,sans-serif;font-size:12px;font-weight:700;letter-spacing:0.35px;text-transform:uppercase;">
                            Código de confirmação
                          </p>
                          <p style="margin:0;color:#e35915;font-family:'Courier New',Consolas,monospace;font-size:34px;line-height:1.1;font-weight:700;letter-spacing:7px;">
                            ${safeCode}
                          </p>
                        </td>
                      </tr>
                    </table>

                    <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%">
                      <tr>
                        <td style="padding:0 0 8px 0;color:#783201;font-family:'DM Sans',Segoe UI,Arial,sans-serif;font-size:14px;line-height:1.55;">
                          ⏱️ Este código expira em <strong>${CONFIRMATION_CODE_EXPIRATION_MINUTES} minutos</strong>.
                        </td>
                      </tr>
                      <tr>
                        <td style="padding:0;color:#8b5a2b;font-family:'DM Sans',Segoe UI,Arial,sans-serif;font-size:13px;line-height:1.55;">
                          🔒 Não compartilhe este código com outras pessoas.
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>

                <tr>
                  <td style="border-top:1px solid #e8f0f8;background:#f8fbff;padding:16px 24px;">
                    <p style="margin:0;color:#8b5a2b;font-family:'DM Sans',Segoe UI,Arial,sans-serif;font-size:12px;line-height:1.6;">
                      Se você não iniciou essa candidatura, ignore este e-mail com segurança.
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
      from: formatEmailFrom(params.orgName),
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

function getConfirmationExpiryDate(nowMs = Date.now()): Date {
  return new Date(nowMs + CONFIRMATION_CODE_EXPIRATION_MINUTES * 60 * 1000)
}

type PendingApplicationRecord = {
  id: string
  confirmationToken: string | null
  confirmationCodeHash: string | null
  confirmationCodeExpiresAt: Date | null
  confirmationResendCount: number
  confirmationLastSentAt: Date | null
  applicantEmail: string
}

function toPendingResponsePayload(
  record: PendingApplicationRecord,
  nowMs = Date.now()
) {
  const expiresAtMs = record.confirmationCodeExpiresAt?.getTime() ?? null
  const resendAvailableAtMs = record.confirmationLastSentAt
    ? record.confirmationLastSentAt.getTime() + RESEND_COOLDOWN_SECONDS * 1000
    : null

  return {
    applicationId: record.id,
    confirmationToken: record.confirmationToken ?? '',
    applicantEmail: record.applicantEmail,
    confirmationExpiresAt: expiresAtMs,
    resendRemaining: Math.max(
      0,
      MAX_RESEND_ATTEMPTS - record.confirmationResendCount
    ),
    resendAvailableAt: resendAvailableAtMs,
    now: nowMs,
  }
}

async function cleanupExpiredPendingApplications(orgId: string) {
  const threshold = new Date(
    Date.now() - PENDING_APPLICATION_TTL_HOURS * 60 * 60 * 1000
  )

  const expiredRows = await db
    .select({
      applicationId: applications.id,
      fileUrl: applicationFiles.url,
    })
    .from(applications)
    .leftJoin(
      applicationFiles,
      eq(applicationFiles.applicationId, applications.id)
    )
    .where(
      and(
        eq(applications.orgId, orgId),
        isNull(applications.confirmedAt),
        lt(applications.createdAt, threshold)
      )
    )

  if (expiredRows.length === 0) {
    return
  }

  const applicationIds = Array.from(
    new Set(expiredRows.map((row) => row.applicationId))
  )

  const fileUrls = expiredRows
    .map((row) => row.fileUrl)
    .filter((url): url is string => typeof url === 'string' && url.length > 0)

  await Promise.all(
    fileUrls.map(async (url) => {
      const key = getKeyFromUrl(url)
      if (!key) return

      try {
        await deleteFile(key)
      } catch (error) {
        console.error('Erro ao remover arquivo antigo de candidatura', {
          url,
          error,
        })
      }
    })
  )

  if (applicationIds.length > 0) {
    await db
      .delete(applications)
      .where(inArray(applications.id, applicationIds))
  }
}

function requireOrgId(user: { orgId?: string | null }): string {
  if (!user.orgId) {
    throw new TRPCError({
      code: 'FORBIDDEN',
      message: 'Usuário não pertence a nenhuma organização',
    })
  }

  return user.orgId
}

function mapSnapshotToApplicationFields(
  snapshot: CatFormFieldSnapshot[]
): ApplicationFormField[] {
  return [...snapshot]
    .sort((a, b) => a.order - b.order)
    .map((field) => ({
      id: field.id,
      type: field.type,
      label: field.label,
      required: field.required,
      helpText: field.helpText,
      options: field.options,
      condition: field.condition,
      mediaConfig: field.mediaConfig,
      order: field.order,
    }))
}

async function getCatApplicationFields(params: {
  orgId: string
  formId: string | null
  formSnapshot: CatFormFieldSnapshot[] | null
}): Promise<ApplicationFormField[]> {
  if (params.formSnapshot && params.formSnapshot.length > 0) {
    return mapSnapshotToApplicationFields(params.formSnapshot)
  }

  if (!params.formId) {
    throw new TRPCError({
      code: 'BAD_REQUEST',
      message: 'Este gato não possui formulário de candidatura configurado',
    })
  }

  const [form] = await db
    .select({ id: forms.id })
    .from(forms)
    .where(and(eq(forms.id, params.formId), eq(forms.orgId, params.orgId)))
    .limit(1)

  if (!form) {
    throw new TRPCError({
      code: 'BAD_REQUEST',
      message: 'O formulário desta candidatura está indisponível',
    })
  }

  const fields = await db
    .select({
      id: formFields.id,
      type: formFields.type,
      label: formFields.label,
      required: formFields.required,
      helpText: formFields.helpText,
      options: formFields.options,
      condition: formFields.condition,
      mediaConfig: formFields.mediaConfig,
      order: formFields.order,
    })
    .from(formFields)
    .where(eq(formFields.formId, params.formId))
    .orderBy(asc(formFields.order))

  return fields.map((field) => ({
    id: field.id,
    type: field.type,
    label: field.label,
    required: field.required,
    helpText: field.helpText,
    options: field.options,
    condition: field.condition,
    mediaConfig: field.mediaConfig,
    order: field.order,
  }))
}

async function getOrgBySlug(slug: string) {
  const [org] = await db
    .select({
      id: orgs.id,
      name: orgs.name,
    })
    .from(orgs)
    .where(eq(orgs.slug, slug))

  if (!org) {
    throw new TRPCError({
      code: 'NOT_FOUND',
      message: 'Organização não encontrada',
    })
  }

  return org
}

async function getPendingApplicationByEmail(params: {
  orgId: string
  catId: string
  applicantEmail: string
}) {
  const [pending] = await db
    .select({
      id: applications.id,
      confirmationToken: applications.confirmationToken,
      confirmationCodeHash: applications.confirmationCodeHash,
      confirmationCodeExpiresAt: applications.confirmationCodeExpiresAt,
      confirmationResendCount: applications.confirmationResendCount,
      confirmationLastSentAt: applications.confirmationLastSentAt,
      applicantEmail: applications.applicantEmail,
    })
    .from(applications)
    .where(
      and(
        eq(applications.orgId, params.orgId),
        eq(applications.catId, params.catId),
        sql`lower(${applications.applicantEmail}) = ${params.applicantEmail}`,
        isNull(applications.confirmedAt)
      )
    )
    .orderBy(desc(applications.createdAt))
    .limit(1)

  return pending
}

async function getConfirmedApplicationByEmail(params: {
  orgId: string
  catId: string
  applicantEmail: string
}) {
  const [confirmed] = await db
    .select({
      id: applications.id,
    })
    .from(applications)
    .where(
      and(
        eq(applications.orgId, params.orgId),
        eq(applications.catId, params.catId),
        sql`lower(${applications.applicantEmail}) = ${params.applicantEmail}`,
        sql`${applications.confirmedAt} is not null`
      )
    )
    .orderBy(desc(applications.createdAt))
    .limit(1)

  return confirmed
}

type FilterableFieldType = 'text' | 'select' | 'boolean' | 'date'
type DynamicFilterOperator = z.infer<typeof dynamicFilterOperatorSchema>

export interface FilterableField {
  id: string
  label: string
  type: FilterableFieldType
  options: string[] | null
}

function getFilterableFields(
  fields: ApplicationFormField[]
): FilterableField[] {
  return fields
    .filter(
      (field): field is ApplicationFormField & { type: FilterableFieldType } =>
        field.type === 'text' ||
        field.type === 'select' ||
        field.type === 'boolean' ||
        field.type === 'date'
    )
    .map((field) => ({
      id: field.id,
      label: field.label,
      type: field.type,
      options: field.type === 'select' ? (field.options ?? []) : null,
    }))
}

function getDynamicFilterCondition(params: {
  field: FilterableField
  operator: DynamicFilterOperator
  value: JsonPrimitive
}): SQL {
  const jsonPath = toJsonPath(params.field.id)
  const jsonValue = sql`json_extract(${applications.responses}, ${jsonPath})`

  if (params.field.type === 'text') {
    if (typeof params.value !== 'string') {
      throw new TRPCError({
        code: 'BAD_REQUEST',
        message: `Filtro inválido para o campo "${params.field.label}"`,
      })
    }

    const normalizedValue = normalizeSearchText(params.value)
    if (!normalizedValue) {
      throw new TRPCError({
        code: 'BAD_REQUEST',
        message: `Informe um valor para filtrar "${params.field.label}"`,
      })
    }

    const normalizedJsonValue = normalizeSqlText(jsonValue)

    if (params.operator === 'contains') {
      return sql`${normalizedJsonValue} like ${`%${normalizedValue}%`}`
    }

    if (params.operator === 'equals') {
      return sql`${normalizedJsonValue} = ${normalizedValue}`
    }

    throw new TRPCError({
      code: 'BAD_REQUEST',
      message: `Operador inválido para "${params.field.label}"`,
    })
  }

  if (params.field.type === 'select') {
    if (typeof params.value !== 'string' || params.operator !== 'equals') {
      throw new TRPCError({
        code: 'BAD_REQUEST',
        message: `Filtro inválido para o campo "${params.field.label}"`,
      })
    }

    return sql`lower(coalesce(cast(${jsonValue} as text), '')) = ${params.value.trim().toLowerCase()}`
  }

  if (params.field.type === 'boolean') {
    if (params.operator !== 'equals') {
      throw new TRPCError({
        code: 'BAD_REQUEST',
        message: `Operador inválido para "${params.field.label}"`,
      })
    }

    const boolValue =
      typeof params.value === 'boolean'
        ? params.value
        : params.value.toLowerCase() === 'true'

    return sql`${jsonValue} = ${boolValue ? 1 : 0}`
  }

  if (params.field.type === 'date') {
    if (typeof params.value !== 'string') {
      throw new TRPCError({
        code: 'BAD_REQUEST',
        message: `Filtro inválido para o campo "${params.field.label}"`,
      })
    }

    const dateValue = params.value.trim()
    if (!/^\d{4}-\d{2}-\d{2}$/.test(dateValue)) {
      throw new TRPCError({
        code: 'BAD_REQUEST',
        message: `Data inválida para o campo "${params.field.label}"`,
      })
    }

    if (params.operator === 'before') {
      return sql`cast(${jsonValue} as text) <= ${dateValue}`
    }

    if (params.operator === 'after') {
      return sql`cast(${jsonValue} as text) >= ${dateValue}`
    }

    if (params.operator === 'equals') {
      return sql`cast(${jsonValue} as text) = ${dateValue}`
    }

    throw new TRPCError({
      code: 'BAD_REQUEST',
      message: `Operador inválido para "${params.field.label}"`,
    })
  }

  throw new TRPCError({
    code: 'BAD_REQUEST',
    message: `Tipo de campo inválido em filtro`,
  })
}

export const applicationsRouter = router({
  getFormForCat: publicProcedure
    .input(
      z.object({
        slug: z.string().min(1),
        catId: z.string().min(1),
      })
    )
    .query(async ({ input }) => {
      const { slug, catId } = input
      const org = await getOrgBySlug(slug)

      const [cat] = await db
        .select({
          id: cats.id,
          name: cats.name,
          sex: cats.sex,
          ageYears: cats.ageYears,
          ageMonths: cats.ageMonths,
          status: cats.status,
          formId: cats.formId,
          formSnapshot: cats.formSnapshot,
        })
        .from(cats)
        .where(and(eq(cats.id, catId), eq(cats.orgId, org.id)))

      if (!cat) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Gato não encontrado',
        })
      }

      if (cat.status !== 'available') {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: 'Este gato não está disponível para adoção',
        })
      }

      if (!cat.formId) {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: 'Este gato não possui formulário de candidatura configurado',
        })
      }

      const [photo] = await db
        .select({ url: catPhotos.url })
        .from(catPhotos)
        .where(eq(catPhotos.catId, catId))
        .orderBy(asc(catPhotos.order))
        .limit(1)

      const fields = await getCatApplicationFields({
        orgId: org.id,
        formId: cat.formId,
        formSnapshot: cat.formSnapshot,
      })

      return {
        cat: {
          id: cat.id,
          name: cat.name,
          sex: cat.sex,
          ageYears: cat.ageYears,
          ageMonths: cat.ageMonths,
          photoUrl: photo?.url ?? null,
        },
        formId: cat.formId,
        fields: fields.map((field) => ({
          id: field.id,
          type: field.type,
          label: field.label,
          required: field.required,
          helpText: field.helpText,
          options: field.options,
          condition: field.condition,
          mediaConfig: field.mediaConfig,
        })),
      }
    }),

  getPresignedUrl: publicProcedure
    .input(
      z.object({
        filename: z.string().min(1),
        contentType: z
          .string()
          .refine((type) => ALLOWED_CONTENT_TYPES.includes(type), {
            message: `Tipo de arquivo não permitido. Use: ${ALLOWED_CONTENT_TYPES.join(', ')}`,
          }),
        fileSize: z.number(),
      })
    )
    .mutation(async ({ input }) => {
      const { filename, contentType, fileSize } = input
      const isVideo = ALLOWED_VIDEO_TYPES.includes(contentType)
      const maxSize = isVideo ? MAX_VIDEO_SIZE : MAX_IMAGE_SIZE

      if (fileSize > maxSize) {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: `Arquivo muito grande. Máximo: ${maxSize / 1024 / 1024}MB`,
        })
      }

      const key = generateApplicationFileKey(filename)
      const presignedUrl = await getPresignedUploadUrl(key, contentType)

      return {
        presignedUrl,
        key,
      }
    }),

  confirmUpload: publicProcedure
    .input(
      z.object({
        key: z.string().min(1),
      })
    )
    .mutation(({ input }) => {
      const publicUrl = getPublicUrl(input.key)
      return {
        publicUrl,
        key: input.key,
      }
    }),

  listByCat: protectedProcedure
    .input(listByCatSchema)
    .query(async ({ ctx, input }) => {
      const orgId = requireOrgId(ctx.session.user)
      const offset = (input.page - 1) * input.limit

      const [cat] = await db
        .select({
          id: cats.id,
          name: cats.name,
          status: cats.status,
          formId: cats.formId,
          formSnapshot: cats.formSnapshot,
        })
        .from(cats)
        .where(and(eq(cats.id, input.catId), eq(cats.orgId, orgId)))
        .limit(1)

      if (!cat) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Gato não encontrado',
        })
      }

      const [photo] = await db
        .select({ url: catPhotos.url })
        .from(catPhotos)
        .where(eq(catPhotos.catId, cat.id))
        .orderBy(asc(catPhotos.order))
        .limit(1)

      const fields = await getCatApplicationFields({
        orgId,
        formId: cat.formId,
        formSnapshot: cat.formSnapshot,
      })
      const filterableFields = getFilterableFields(fields)
      const filterableFieldsMap = new Map(
        filterableFields.map((field) => [field.id, field])
      )

      const baseWhereConditions: SQL[] = [
        eq(applications.orgId, orgId),
        eq(applications.catId, input.catId),
        sql`${applications.confirmedAt} is not null`,
      ]

      if (input.search) {
        const normalizedSearch = normalizeSearchText(input.search)
        if (normalizedSearch.length > 0) {
          baseWhereConditions.push(
            sql`coalesce(${applications.applicantNameNormalized}, '') like ${`%${normalizedSearch}%`}`
          )
        }
      }

      for (const dynamicFilter of input.dynamicFilters ?? []) {
        const field = filterableFieldsMap.get(dynamicFilter.fieldId)
        if (!field) {
          continue
        }

        baseWhereConditions.push(
          getDynamicFilterCondition({
            field,
            operator: dynamicFilter.operator,
            value: dynamicFilter.value,
          })
        )
      }

      const whereConditions = [...baseWhereConditions]

      if (input.status) {
        whereConditions.push(eq(applications.status, input.status))
      }

      const [countResult] = await db
        .select({ count: sql<number>`count(*)` })
        .from(applications)
        .where(and(...whereConditions))

      const rows = await db
        .select({
          id: applications.id,
          applicantName: applications.applicantName,
          applicantWhatsapp: applications.applicantWhatsapp,
          status: applications.status,
          createdAt: applications.createdAt,
        })
        .from(applications)
        .where(and(...whereConditions))
        .orderBy(asc(applications.createdAt))
        .limit(input.limit)
        .offset(offset)

      const total = countResult?.count ?? 0

      return {
        cat: {
          id: cat.id,
          name: cat.name,
          status: cat.status,
          photoUrl: photo?.url ?? null,
        },
        filterableFields,
        applications: rows,
        pagination: {
          page: input.page,
          limit: input.limit,
          total,
          totalPages: Math.ceil(total / input.limit),
        },
      }
    }),

  getById: protectedProcedure
    .input(getByIdSchema)
    .query(async ({ ctx, input }) => {
      const orgId = requireOrgId(ctx.session.user)

      const [application] = await db
        .select({
          id: applications.id,
          status: applications.status,
          applicantName: applications.applicantName,
          applicantEmail: applications.applicantEmail,
          applicantWhatsapp: applications.applicantWhatsapp,
          responses: applications.responses,
          createdAt: applications.createdAt,
          confirmedAt: applications.confirmedAt,
          catId: cats.id,
          catName: cats.name,
          catFormId: cats.formId,
          catFormSnapshot: cats.formSnapshot,
        })
        .from(applications)
        .innerJoin(cats, eq(cats.id, applications.catId))
        .where(
          and(
            eq(applications.id, input.id),
            eq(applications.orgId, orgId),
            sql`${applications.confirmedAt} is not null`
          )
        )
        .limit(1)

      if (!application) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Candidatura não encontrada',
        })
      }

      const [photo] = await db
        .select({ url: catPhotos.url })
        .from(catPhotos)
        .where(eq(catPhotos.catId, application.catId))
        .orderBy(asc(catPhotos.order))
        .limit(1)

      const fields = await getCatApplicationFields({
        orgId,
        formId: application.catFormId,
        formSnapshot: application.catFormSnapshot,
      })

      const responses = (application.responses ??
        {}) as ApplicationResponsesRecord
      const fieldsById = new Map(fields.map((field) => [field.id, field]))

      const visibleFields = fields.filter((field) =>
        isFieldVisible(field, responses)
      )

      const normalizedResponses = visibleFields.map((field) => ({
        fieldId: field.id,
        label: field.label,
        type: field.type,
        value:
          responses[field.id] !== undefined
            ? (responses[field.id] ?? null)
            : null,
      }))

      const orphanResponses = Object.entries(responses)
        .filter(([fieldId]) => !fieldsById.has(fieldId))
        .map(([fieldId, value]) => ({
          fieldId,
          label: 'Campo removido',
          type: 'text' as const,
          value,
        }))

      const files = await db
        .select({
          id: applicationFiles.id,
          fieldId: applicationFiles.fieldId,
          url: applicationFiles.url,
          fileType: applicationFiles.fileType,
          createdAt: applicationFiles.createdAt,
        })
        .from(applicationFiles)
        .where(eq(applicationFiles.applicationId, application.id))
        .orderBy(asc(applicationFiles.createdAt))

      return {
        application: {
          id: application.id,
          status: application.status,
          applicantName: application.applicantName,
          applicantEmail: application.applicantEmail,
          applicantWhatsapp: application.applicantWhatsapp,
          createdAt: application.createdAt,
          confirmedAt: application.confirmedAt,
        },
        cat: {
          id: application.catId,
          name: application.catName,
          photoUrl: photo?.url ?? null,
        },
        responses: [...normalizedResponses, ...orphanResponses],
        files: files.map((file) => ({
          ...file,
          fieldLabel: fieldsById.get(file.fieldId)?.label ?? 'Arquivo enviado',
        })),
      }
    }),

  updateStatus: protectedProcedure
    .input(updateStatusSchema)
    .mutation(async ({ ctx, input }) => {
      const orgId = requireOrgId(ctx.session.user)

      const [application] = await db
        .select({
          id: applications.id,
          confirmedAt: applications.confirmedAt,
        })
        .from(applications)
        .where(
          and(eq(applications.id, input.id), eq(applications.orgId, orgId))
        )
        .limit(1)

      if (!application || !application.confirmedAt) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Candidatura não encontrada',
        })
      }

      await db
        .update(applications)
        .set({
          status: input.status,
        })
        .where(eq(applications.id, input.id))

      return {
        success: true,
      }
    }),

  create: publicProcedure
    .input(createApplicationSchema)
    .mutation(async ({ input }) => {
      const {
        slug,
        catId,
        applicantName,
        applicantEmail,
        applicantWhatsapp,
        responses,
        files,
        lgpdConsent,
        whatsappConsent,
      } = input

      const org = await getOrgBySlug(slug)
      await cleanupExpiredPendingApplications(org.id)

      const [cat] = await db
        .select({
          id: cats.id,
          name: cats.name,
          status: cats.status,
          formId: cats.formId,
          formSnapshot: cats.formSnapshot,
        })
        .from(cats)
        .where(and(eq(cats.id, catId), eq(cats.orgId, org.id)))

      if (!cat) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Gato não encontrado',
        })
      }

      if (cat.status !== 'available') {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: 'Este gato não está disponível para adoção',
        })
      }

      if (!cat.formId) {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: 'Este gato não possui formulário de candidatura configurado',
        })
      }

      const normalizedApplicantEmail = normalizeEmail(applicantEmail)
      const normalizedApplicantName = normalizeSearchText(applicantName)

      const confirmedApplication = await getConfirmedApplicationByEmail({
        orgId: org.id,
        catId,
        applicantEmail: normalizedApplicantEmail,
      })

      if (confirmedApplication) {
        throw new TRPCError({
          code: 'CONFLICT',
          message:
            'Já existe uma candidatura confirmada para este gato com este e-mail',
        })
      }

      const pendingApplication = await getPendingApplicationByEmail({
        orgId: org.id,
        catId,
        applicantEmail: normalizedApplicantEmail,
      })

      if (pendingApplication) {
        let pendingRecord: PendingApplicationRecord = pendingApplication

        if (
          !pendingRecord.confirmationToken ||
          !pendingRecord.confirmationCodeHash ||
          !pendingRecord.confirmationCodeExpiresAt
        ) {
          const nextToken = pendingRecord.confirmationToken ?? nanoid(32)
          const nextCode = generateConfirmationCode()
          const nextCodeHash = hashConfirmationCode(nextCode, nextToken)
          const nextExpiry = getConfirmationExpiryDate()
          const now = new Date()

          await sendApplicationConfirmationEmail({
            to: pendingRecord.applicantEmail,
            applicantName,
            catName: cat.name,
            orgName: org.name,
            code: nextCode,
          })

          await db
            .update(applications)
            .set({
              confirmationToken: nextToken,
              confirmationCodeHash: nextCodeHash,
              confirmationCodeExpiresAt: nextExpiry,
              confirmationLastSentAt: now,
              confirmationResendCount: 0,
            })
            .where(eq(applications.id, pendingRecord.id))

          pendingRecord = {
            ...pendingRecord,
            confirmationToken: nextToken,
            confirmationCodeHash: nextCodeHash,
            confirmationCodeExpiresAt: nextExpiry,
            confirmationLastSentAt: now,
            confirmationResendCount: 0,
          }
        }

        return {
          status: 'pending_exists' as const,
          ...toPendingResponsePayload(pendingRecord),
        }
      }

      const fields = await getCatApplicationFields({
        orgId: org.id,
        formId: cat.formId,
        formSnapshot: cat.formSnapshot,
      })

      for (const field of fields) {
        if (!isFieldVisible(field, responses)) continue
        if (!field.required) continue

        const value = responses[field.id]
        if (!hasResponseValue(value)) {
          throw new TRPCError({
            code: 'BAD_REQUEST',
            message: `Campo obrigatório não preenchido: ${field.label}`,
          })
        }
      }

      const confirmationToken = nanoid(32)
      const confirmationCode = generateConfirmationCode()
      const confirmationCodeHash = hashConfirmationCode(
        confirmationCode,
        confirmationToken
      )
      const confirmationCodeExpiresAt = getConfirmationExpiryDate()
      const applicationId = nanoid()

      await db.transaction(async (tx) => {
        await tx.insert(applications).values({
          id: applicationId,
          orgId: org.id,
          catId,
          formId: cat.formId,
          status: 'pending',
          applicantName,
          applicantNameNormalized: normalizedApplicantName,
          applicantEmail: normalizedApplicantEmail,
          applicantWhatsapp,
          responses,
          lgpdConsent,
          whatsappConsent,
          confirmationToken,
          confirmationCodeHash,
          confirmationCodeExpiresAt,
          confirmationResendCount: 0,
          confirmationLastSentAt: null,
          confirmedAt: null,
        })

        if (files && files.length > 0) {
          await tx.insert(applicationFiles).values(
            files.map((file) => ({
              id: nanoid(),
              applicationId,
              fieldId: file.fieldId,
              url: file.url,
              fileType: file.fileType,
            }))
          )
        }
      })

      // Skip email confirmation for preview/testing environments
      if (env.SKIP_EMAIL_CONFIRMATION) {
        await db
          .update(applications)
          .set({
            confirmedAt: new Date(),
          })
          .where(eq(applications.id, applicationId))

        return {
          status: 'confirmed' as const,
          applicationId,
          applicantEmail: normalizedApplicantEmail,
          now: Date.now(),
        }
      }

      const sentAt = new Date()

      try {
        await sendApplicationConfirmationEmail({
          to: normalizedApplicantEmail,
          applicantName,
          catName: cat.name,
          orgName: org.name,
          code: confirmationCode,
        })

        await db
          .update(applications)
          .set({
            confirmationLastSentAt: sentAt,
          })
          .where(eq(applications.id, applicationId))
      } catch (error) {
        console.error(
          'Erro ao enviar email de confirmação da candidatura',
          error
        )
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message:
            'Candidatura criada, mas não foi possível enviar o código agora. Tente novamente em instantes.',
        })
      }

      return {
        status: 'created' as const,
        applicationId,
        confirmationToken,
        applicantEmail: normalizedApplicantEmail,
        confirmationExpiresAt: confirmationCodeExpiresAt.getTime(),
        resendRemaining: MAX_RESEND_ATTEMPTS,
        resendAvailableAt: sentAt.getTime() + RESEND_COOLDOWN_SECONDS * 1000,
        now: Date.now(),
      }
    }),

  confirmCode: publicProcedure
    .input(confirmCodeSchema)
    .mutation(async ({ input }) => {
      const [application] = await db
        .select({
          id: applications.id,
          orgId: applications.orgId,
          catId: applications.catId,
          applicantName: applications.applicantName,
          applicantEmail: applications.applicantEmail,
          confirmedAt: applications.confirmedAt,
          confirmationToken: applications.confirmationToken,
          confirmationCodeHash: applications.confirmationCodeHash,
          confirmationCodeExpiresAt: applications.confirmationCodeExpiresAt,
        })
        .from(applications)
        .where(eq(applications.confirmationToken, input.confirmationToken))
        .limit(1)

      if (!application) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Candidatura não encontrada para este código de confirmação',
        })
      }

      if (application.confirmedAt) {
        return {
          status: 'already_confirmed' as const,
          applicationId: application.id,
        }
      }

      if (
        !application.confirmationToken ||
        !application.confirmationCodeHash ||
        !application.confirmationCodeExpiresAt
      ) {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: 'Solicite um novo código de confirmação para continuar',
        })
      }

      if (application.confirmationCodeExpiresAt.getTime() < Date.now()) {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: 'Código expirado. Solicite um novo código',
        })
      }

      const providedHash = hashConfirmationCode(
        input.code,
        application.confirmationToken
      )

      if (!isCodeHashValid(application.confirmationCodeHash, providedHash)) {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: 'Código inválido. Verifique e tente novamente',
        })
      }

      await db
        .update(applications)
        .set({
          confirmedAt: new Date(),
        })
        .where(eq(applications.id, application.id))

      // Send confirmation success email
      try {
        const [org] = await db
          .select({ name: orgs.name })
          .from(orgs)
          .where(eq(orgs.id, application.orgId))
          .limit(1)

        const [cat] = await db
          .select({ name: cats.name, sex: cats.sex })
          .from(cats)
          .where(eq(cats.id, application.catId))
          .limit(1)

        if (org && cat) {
          await sendApplicationConfirmedEmail({
            to: application.applicantEmail,
            applicantName: application.applicantName,
            catName: cat.name,
            catSex: cat.sex,
            orgName: org.name,
          })
        }
      } catch (error) {
        // Log error but don't fail the confirmation - the application is already confirmed
        console.error('Erro ao enviar email de confirmação de candidatura', error)
      }

      return {
        status: 'confirmed' as const,
        applicationId: application.id,
      }
    }),

  resendCode: publicProcedure
    .input(resendCodeSchema)
    .mutation(async ({ input }) => {
      const [application] = await db
        .select({
          id: applications.id,
          orgId: applications.orgId,
          catId: applications.catId,
          applicantName: applications.applicantName,
          applicantEmail: applications.applicantEmail,
          confirmedAt: applications.confirmedAt,
          confirmationToken: applications.confirmationToken,
          confirmationResendCount: applications.confirmationResendCount,
          confirmationLastSentAt: applications.confirmationLastSentAt,
        })
        .from(applications)
        .where(eq(applications.confirmationToken, input.confirmationToken))
        .limit(1)

      if (!application) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Candidatura não encontrada para reenvio do código',
        })
      }

      if (application.confirmedAt) {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: 'Esta candidatura já foi confirmada',
        })
      }

      if (!application.confirmationToken) {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: 'Token de confirmação inválido',
        })
      }

      if (application.confirmationResendCount >= MAX_RESEND_ATTEMPTS) {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: `Limite de ${MAX_RESEND_ATTEMPTS} reenvios atingido`,
        })
      }

      const now = Date.now()
      const lastSentAtMs = application.confirmationLastSentAt?.getTime() ?? null

      if (lastSentAtMs && now < lastSentAtMs + RESEND_COOLDOWN_SECONDS * 1000) {
        const remainingSeconds = Math.ceil(
          (lastSentAtMs + RESEND_COOLDOWN_SECONDS * 1000 - now) / 1000
        )
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: `Aguarde ${remainingSeconds}s para reenviar o código`,
        })
      }

      const [org] = await db
        .select({
          name: orgs.name,
        })
        .from(orgs)
        .where(eq(orgs.id, application.orgId))
        .limit(1)

      const [cat] = await db
        .select({
          name: cats.name,
        })
        .from(cats)
        .where(eq(cats.id, application.catId))
        .limit(1)

      if (!org || !cat) {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: 'Não foi possível reenviar código para esta candidatura',
        })
      }

      const nextCode = generateConfirmationCode()
      const nextCodeHash = hashConfirmationCode(
        nextCode,
        application.confirmationToken
      )
      const nextExpiresAt = getConfirmationExpiryDate(now)
      const sentAt = new Date(now)

      try {
        await sendApplicationConfirmationEmail({
          to: application.applicantEmail,
          applicantName: application.applicantName,
          catName: cat.name,
          orgName: org.name,
          code: nextCode,
        })
      } catch (error) {
        console.error(
          'Erro ao reenviar email de confirmação da candidatura',
          error
        )
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Não foi possível reenviar o código agora. Tente novamente',
        })
      }

      const nextResendCount = application.confirmationResendCount + 1

      await db
        .update(applications)
        .set({
          confirmationCodeHash: nextCodeHash,
          confirmationCodeExpiresAt: nextExpiresAt,
          confirmationResendCount: nextResendCount,
          confirmationLastSentAt: sentAt,
        })
        .where(eq(applications.id, application.id))

      const payload = toPendingResponsePayload(
        {
          id: application.id,
          confirmationToken: application.confirmationToken,
          confirmationCodeHash: nextCodeHash,
          confirmationCodeExpiresAt: nextExpiresAt,
          confirmationResendCount: nextResendCount,
          confirmationLastSentAt: sentAt,
          applicantEmail: application.applicantEmail,
        },
        now
      )

      return {
        status: 'resent' as const,
        ...payload,
      }
    }),
})
