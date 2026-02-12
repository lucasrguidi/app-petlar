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
import { TRPCError } from '@trpc/server'
import { and, asc, eq } from 'drizzle-orm'
import { nanoid } from 'nanoid'
import { z } from 'zod'

import { publicProcedure, router } from '../index'
import {
  generateApplicationFileKey,
  getPresignedUploadUrl,
  getPublicUrl,
} from '../lib/r2'

// Allowed content types for application uploads
const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp']
const ALLOWED_VIDEO_TYPES = ['video/mp4', 'video/quicktime', 'video/webm']
const ALLOWED_CONTENT_TYPES = [...ALLOWED_IMAGE_TYPES, ...ALLOWED_VIDEO_TYPES]

const MAX_IMAGE_SIZE = 5 * 1024 * 1024 // 5MB
const MAX_VIDEO_SIZE = 50 * 1024 * 1024 // 50MB

type ApplicationResponsesRecord = Record<string, string | boolean | null>

// Schema for creating an application
const createApplicationSchema = z.object({
  slug: z.string().min(1),
  catId: z.string().min(1),

  // Fixed applicant data
  applicantName: z.string().min(1, 'Nome é obrigatório').max(200),
  applicantEmail: z.string().email('Email inválido'),
  applicantWhatsapp: z.string().min(10, 'WhatsApp inválido').max(20),

  // Dynamic form responses
  responses: z.record(z.string(), z.union([z.string(), z.boolean(), z.null()])),

  // File uploads (URLs after upload)
  files: z
    .array(
      z.object({
        fieldId: z.string(),
        url: z.string().url(),
        fileType: z.enum(['image', 'video']),
      })
    )
    .optional(),

  // LGPD consents - must be true
  lgpdConsent: z.literal(true, {
    message: 'Você precisa aceitar o compartilhamento de dados',
  }),
  whatsappConsent: z.literal(true, {
    message: 'Você precisa aceitar o contato via WhatsApp',
  }),
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

/**
 * Get org by slug, throw if not found
 */
async function getOrgBySlug(slug: string) {
  const [org] = await db.select({ id: orgs.id }).from(orgs).where(eq(orgs.slug, slug))

  if (!org) {
    throw new TRPCError({
      code: 'NOT_FOUND',
      message: 'Organização não encontrada',
    })
  }

  return org
}

export const applicationsRouter = router({
  /**
   * Get form data for a cat (public).
   * Returns cat summary and form fields for the application.
   */
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

      // Get cat with its form
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

      // Get cat's first photo
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

  /**
   * Get presigned URL for uploading application files (public).
   */
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

      // Check file size based on type
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

  /**
   * Confirm file upload and get public URL (public).
   */
  confirmUpload: publicProcedure
    .input(
      z.object({
        key: z.string().min(1),
      })
    )
    .mutation(({ input }) => {
      const { key } = input
      const publicUrl = getPublicUrl(key)

      return {
        publicUrl,
        key,
      }
    }),

  /**
   * Create a new adoption application (public).
   */
  create: publicProcedure.input(createApplicationSchema).mutation(async ({ input }) => {
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

    // Verify cat exists, belongs to org, and is available
    const [cat] = await db
      .select({
        id: cats.id,
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

    // Validate required form fields if form exists
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
      if (!isFieldVisible(field, responses)) {
        continue
      }

      if (!field.required) {
        continue
      }

      const value = responses[field.id]
      if (!hasResponseValue(value)) {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: `Campo obrigatório não preenchido: ${field.label}`,
        })
      }
    }

    // Generate confirmation token for email confirmation (phase 4.5)
    const confirmationToken = nanoid(32)
    const applicationId = nanoid()

    await db.transaction(async (tx) => {
      // Create application
      await tx.insert(applications).values({
        id: applicationId,
        orgId: org.id,
        catId,
        formId: cat.formId,
        status: 'pending',
        applicantName,
        applicantEmail,
        applicantWhatsapp,
        responses,
        lgpdConsent,
        whatsappConsent,
        confirmationToken,
        confirmedAt: null, // Will be set when email is confirmed (phase 4.5)
      })

      // Create file records if any
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

    return {
      id: applicationId,
      confirmationToken,
    }
  }),
})
