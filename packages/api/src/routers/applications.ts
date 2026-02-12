import { createHash, randomInt, timingSafeEqual } from 'node:crypto'

import { db } from '@app-petlar/db'
import {
  applicationFiles,
  applications,
  catPhotos,
  cats,
  formFields,
  forms,
  orgs,
  type FormFieldCondition,
} from '@app-petlar/db/schema'
import { env } from '@app-petlar/env/server'
import { TRPCError } from '@trpc/server'
import { and, asc, desc, eq, inArray, isNull, lt, sql } from 'drizzle-orm'
import { nanoid } from 'nanoid'
import { z } from 'zod'

import { publicProcedure, router } from '../index'
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

function normalizeEmail(email: string): string {
  return email.trim().toLowerCase()
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
    '',
    'Se você não solicitou essa candidatura, ignore este e-mail.',
  ].join('\n')

  const html = `
    <div style="font-family: Arial, sans-serif; color: #1f2937; line-height: 1.6;">
      <p>Olá, <strong>${safeApplicantName}</strong>!</p>
      <p>
        Você iniciou uma candidatura para adoção de <strong>${safeCatName}</strong>
        na <strong>${safeOrgName}</strong>.
      </p>
      <p>Seu código de confirmação é:</p>
      <p style="font-size: 32px; letter-spacing: 6px; font-weight: 700; margin: 8px 0 16px;">
        ${safeCode}
      </p>
      <p>Esse código expira em <strong>${CONFIRMATION_CODE_EXPIRATION_MINUTES} minutos</strong>.</p>
      <p style="color: #6b7280;">Se você não solicitou essa candidatura, ignore este e-mail.</p>
    </div>
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
  const threshold = new Date(Date.now() - PENDING_APPLICATION_TTL_HOURS * 60 * 60 * 1000)

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

      const [form] = await db
        .select({ id: forms.id })
        .from(forms)
        .where(
          and(
            eq(forms.id, cat.formId),
            eq(forms.orgId, org.id),
            eq(forms.active, true)
          )
        )

      if (!form) {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: 'O formulário desta candidatura está inativo ou indisponível',
        })
      }

      const fields: Array<{
        id: string
        type: string
        label: string
        required: boolean
        helpText: string | null
        options: string[] | null
        condition: { fieldId: string; operator: string; value: string | boolean } | null
        mediaConfig: { kind: 'image' | 'video' } | null
      }> = await db
        .select({
          id: formFields.id,
          type: formFields.type,
          label: formFields.label,
          required: formFields.required,
          helpText: formFields.helpText,
          options: formFields.options,
          condition: formFields.condition,
          mediaConfig: formFields.mediaConfig,
        })
        .from(formFields)
        .where(eq(formFields.formId, cat.formId))
        .orderBy(asc(formFields.order))

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
        fields,
      }
    }),

  getPresignedUrl: publicProcedure
    .input(
      z.object({
        filename: z.string().min(1),
        contentType: z.string().refine(
          (type) => ALLOWED_CONTENT_TYPES.includes(type),
          {
            message: `Tipo de arquivo não permitido. Use: ${ALLOWED_CONTENT_TYPES.join(', ')}`,
          }
        ),
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

      const [form] = await db
        .select({ id: forms.id })
        .from(forms)
        .where(
          and(
            eq(forms.id, cat.formId),
            eq(forms.orgId, org.id),
            eq(forms.active, true)
          )
        )

      if (!form) {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: 'O formulário desta candidatura está inativo ou indisponível',
        })
      }

      const normalizedApplicantEmail = normalizeEmail(applicantEmail)

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

      const fields = await db
        .select({
          id: formFields.id,
          required: formFields.required,
          label: formFields.label,
          condition: formFields.condition,
        })
        .from(formFields)
        .where(eq(formFields.formId, cat.formId))
        .orderBy(asc(formFields.order))

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
        console.error('Erro ao enviar email de confirmação da candidatura', error)
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

      if (
        lastSentAtMs &&
        now < lastSentAtMs + RESEND_COOLDOWN_SECONDS * 1000
      ) {
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
        console.error('Erro ao reenviar email de confirmação da candidatura', error)
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
