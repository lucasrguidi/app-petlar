import { db } from '@app-petlar/db'
import { adoptions, applications, catPhotos, cats } from '@app-petlar/db/schema'
import { TRPCError } from '@trpc/server'
import { and, desc, eq, gte, lte, or, sql } from 'drizzle-orm'
import { nanoid } from 'nanoid'
import { z } from 'zod'

import { protectedProcedure, router } from '../index'
import {
  deleteFile,
  generateAdoptionTermKey,
  getKeyFromUrl,
  getPresignedUploadUrl,
  getPublicUrl,
} from '../lib/r2'

const ALLOWED_PDF_TYPES = ['application/pdf']
const MAX_PDF_SIZE = 10 * 1024 * 1024 // 10MB

const listFiltersSchema = z.object({
  search: z.string().trim().max(200).optional(),
  dateFrom: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/)
    .optional(),
  dateTo: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/)
    .optional(),
  page: z.number().int().min(1).default(1),
  limit: z.number().int().min(1).max(50).default(15),
})

const createAdoptionSchema = z.object({
  catId: z.string().min(1),
  applicationId: z.string().min(1).optional(),
  adopterName: z.string().min(1, 'Nome é obrigatório').max(200),
  adopterPhone: z.string().min(10, 'Telefone inválido').max(20),
  adopterEmail: z
    .string()
    .email('E-mail inválido')
    .optional()
    .or(z.literal('')),
  adoptionDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Data inválida'),
  adoptionTermUrl: z.string().url().optional(),
  notes: z.string().max(2000).optional(),
})

const updateAdoptionSchema = z.object({
  id: z.string().min(1),
  adopterName: z.string().min(1).max(200).optional(),
  adopterPhone: z.string().min(10).max(20).optional(),
  adopterEmail: z.string().email().optional().or(z.literal('')),
  adoptionDate: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/)
    .optional(),
  adoptionTermUrl: z.string().url().nullable().optional(),
  notes: z.string().max(2000).nullable().optional(),
})

function normalizeSearchText(value: string): string {
  return value
    .trim()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
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

export const adoptionsRouter = router({
  /**
   * Retorna estatísticas de adoções
   */
  stats: protectedProcedure.query(async ({ ctx }) => {
    const orgId = requireOrgId(ctx.session.user)

    const [result] = await db
      .select({ count: sql<number>`count(*)` })
      .from(adoptions)
      .where(eq(adoptions.orgId, orgId))

    return {
      total: result?.count ?? 0,
    }
  }),

  /**
   * Lista adoções com filtros e paginação
   */
  list: protectedProcedure
    .input(listFiltersSchema)
    .query(async ({ ctx, input }) => {
      const orgId = requireOrgId(ctx.session.user)
      const { search, dateFrom, dateTo, page, limit } = input
      const offset = (page - 1) * limit

      const conditions = [eq(adoptions.orgId, orgId)]

      if (search) {
        const normalizedSearch = normalizeSearchText(search)
        if (normalizedSearch.length > 0) {
          conditions.push(
            or(
              sql`coalesce(${adoptions.adopterNameNormalized}, '') like ${`%${normalizedSearch}%`}`,
              sql`lower(${cats.name}) like ${`%${normalizedSearch}%`}`
            )!
          )
        }
      }

      if (dateFrom) {
        conditions.push(gte(adoptions.adoptionDate, dateFrom))
      }

      if (dateTo) {
        conditions.push(lte(adoptions.adoptionDate, dateTo))
      }

      const adoptionsList = await db
        .select({
          id: adoptions.id,
          catId: adoptions.catId,
          catName: cats.name,
          catSex: cats.sex,
          catAgeYears: cats.ageYears,
          catAgeMonths: cats.ageMonths,
          catFiv: cats.fiv,
          catFelv: cats.felv,
          catCastrated: cats.castrated,
          applicationId: adoptions.applicationId,
          adopterName: adoptions.adopterName,
          adopterPhone: adoptions.adopterPhone,
          adopterEmail: adoptions.adopterEmail,
          adoptionDate: adoptions.adoptionDate,
          adoptionTermUrl: adoptions.adoptionTermUrl,
          notes: adoptions.notes,
          createdAt: adoptions.createdAt,
        })
        .from(adoptions)
        .innerJoin(cats, eq(adoptions.catId, cats.id))
        .where(and(...conditions))
        .orderBy(desc(adoptions.adoptionDate), desc(adoptions.createdAt))
        .limit(limit)
        .offset(offset)

      // Get cat photos
      const catIds = adoptionsList.map((a) => a.catId)
      const photos =
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

      const photosByCatId = photos.reduce<Record<string, string>>(
        (acc, photo) => {
          if (!acc[photo.catId]) {
            acc[photo.catId] = photo.url
          }
          return acc
        },
        {}
      )

      const [countResult] = await db
        .select({ count: sql<number>`count(*)` })
        .from(adoptions)
        .innerJoin(cats, eq(adoptions.catId, cats.id))
        .where(and(...conditions))

      const total = countResult?.count ?? 0

      return {
        adoptions: adoptionsList.map((adoption) => ({
          ...adoption,
          catPhotoUrl: photosByCatId[adoption.catId] ?? null,
        })),
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit),
        },
      }
    }),

  /**
   * Obtém detalhes de uma adoção
   */
  getById: protectedProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ ctx, input }) => {
      const orgId = requireOrgId(ctx.session.user)

      const [adoption] = await db
        .select({
          id: adoptions.id,
          catId: adoptions.catId,
          catName: cats.name,
          catSex: cats.sex,
          catAgeYears: cats.ageYears,
          catAgeMonths: cats.ageMonths,
          applicationId: adoptions.applicationId,
          adopterName: adoptions.adopterName,
          adopterPhone: adoptions.adopterPhone,
          adopterEmail: adoptions.adopterEmail,
          adoptionDate: adoptions.adoptionDate,
          adoptionTermUrl: adoptions.adoptionTermUrl,
          notes: adoptions.notes,
          createdAt: adoptions.createdAt,
          updatedAt: adoptions.updatedAt,
        })
        .from(adoptions)
        .innerJoin(cats, eq(adoptions.catId, cats.id))
        .where(and(eq(adoptions.id, input.id), eq(adoptions.orgId, orgId)))

      if (!adoption) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Adoção não encontrada',
        })
      }

      const [photo] = await db
        .select({ url: catPhotos.url })
        .from(catPhotos)
        .where(eq(catPhotos.catId, adoption.catId))
        .orderBy(catPhotos.order)
        .limit(1)

      return {
        ...adoption,
        catPhotoUrl: photo?.url ?? null,
      }
    }),

  /**
   * Lista candidatos aprovados/em análise de um gato para seleção no modal de adoção
   */
  getApprovedApplicants: protectedProcedure
    .input(z.object({ catId: z.string() }))
    .query(async ({ ctx, input }) => {
      const orgId = requireOrgId(ctx.session.user)

      // Verify cat belongs to org
      const [cat] = await db
        .select({ id: cats.id, name: cats.name })
        .from(cats)
        .where(and(eq(cats.id, input.catId), eq(cats.orgId, orgId)))

      if (!cat) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Gato não encontrado',
        })
      }

      const applicants = await db
        .select({
          id: applications.id,
          applicantName: applications.applicantName,
          applicantWhatsapp: applications.applicantWhatsapp,
          applicantEmail: applications.applicantEmail,
          status: applications.status,
          createdAt: applications.createdAt,
        })
        .from(applications)
        .where(
          and(
            eq(applications.orgId, orgId),
            eq(applications.catId, input.catId),
            sql`${applications.confirmedAt} is not null`,
            sql`${applications.status} in ('approved', 'reviewing')`
          )
        )
        .orderBy(desc(applications.createdAt))

      return {
        cat: { id: cat.id, name: cat.name },
        applicants,
      }
    }),

  /**
   * Cria uma nova adoção
   */
  create: protectedProcedure
    .input(createAdoptionSchema)
    .mutation(async ({ ctx, input }) => {
      const orgId = requireOrgId(ctx.session.user)
      const userId = ctx.session.user.id

      // Verify cat exists and is not already adopted
      const [cat] = await db
        .select({ id: cats.id, status: cats.status })
        .from(cats)
        .where(and(eq(cats.id, input.catId), eq(cats.orgId, orgId)))

      if (!cat) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Gato não encontrado',
        })
      }

      if (cat.status === 'adopted') {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: 'Este gato já foi adotado',
        })
      }

      // Check if cat already has an adoption record
      const [existingAdoption] = await db
        .select({ id: adoptions.id })
        .from(adoptions)
        .where(eq(adoptions.catId, input.catId))

      if (existingAdoption) {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: 'Já existe um registro de adoção para este gato',
        })
      }

      // If applicationId provided, verify it belongs to the cat and is approved/reviewing
      if (input.applicationId) {
        const [application] = await db
          .select({ id: applications.id, status: applications.status })
          .from(applications)
          .where(
            and(
              eq(applications.id, input.applicationId),
              eq(applications.orgId, orgId),
              eq(applications.catId, input.catId),
              sql`${applications.confirmedAt} is not null`
            )
          )

        if (!application) {
          throw new TRPCError({
            code: 'BAD_REQUEST',
            message: 'Candidatura não encontrada ou não pertence a este gato',
          })
        }

        if (!['approved', 'reviewing'].includes(application.status)) {
          throw new TRPCError({
            code: 'BAD_REQUEST',
            message: 'Candidatura não está aprovada ou em análise',
          })
        }
      }

      const adoptionId = nanoid()
      const normalizedAdopterName = normalizeSearchText(input.adopterName)

      await db.transaction(async (tx) => {
        // Create adoption record
        await tx.insert(adoptions).values({
          id: adoptionId,
          orgId,
          catId: input.catId,
          applicationId: input.applicationId ?? null,
          adopterName: input.adopterName,
          adopterNameNormalized: normalizedAdopterName,
          adopterPhone: input.adopterPhone,
          adopterEmail: input.adopterEmail || null,
          adoptionDate: input.adoptionDate,
          adoptionTermUrl: input.adoptionTermUrl ?? null,
          notes: input.notes ?? null,
          createdBy: userId,
        })

        // Update cat status to adopted
        await tx
          .update(cats)
          .set({ status: 'adopted' })
          .where(eq(cats.id, input.catId))
      })

      return { id: adoptionId }
    }),

  /**
   * Atualiza uma adoção existente
   */
  update: protectedProcedure
    .input(updateAdoptionSchema)
    .mutation(async ({ ctx, input }) => {
      const orgId = requireOrgId(ctx.session.user)

      const [existingAdoption] = await db
        .select({
          id: adoptions.id,
          adoptionTermUrl: adoptions.adoptionTermUrl,
        })
        .from(adoptions)
        .where(and(eq(adoptions.id, input.id), eq(adoptions.orgId, orgId)))

      if (!existingAdoption) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Adoção não encontrada',
        })
      }

      const updateData: Record<string, unknown> = {}

      if (input.adopterName !== undefined) {
        updateData.adopterName = input.adopterName
        updateData.adopterNameNormalized = normalizeSearchText(
          input.adopterName
        )
      }
      if (input.adopterPhone !== undefined) {
        updateData.adopterPhone = input.adopterPhone
      }
      if (input.adopterEmail !== undefined) {
        updateData.adopterEmail = input.adopterEmail || null
      }
      if (input.adoptionDate !== undefined) {
        updateData.adoptionDate = input.adoptionDate
      }
      if (input.notes !== undefined) {
        updateData.notes = input.notes
      }

      // Handle PDF replacement
      if (input.adoptionTermUrl !== undefined) {
        // If there's an old PDF and we're setting a new one or null, delete the old one
        if (
          existingAdoption.adoptionTermUrl &&
          existingAdoption.adoptionTermUrl !== input.adoptionTermUrl
        ) {
          const oldKey = getKeyFromUrl(existingAdoption.adoptionTermUrl)
          if (oldKey) {
            try {
              await deleteFile(oldKey)
            } catch (error) {
              console.error('Erro ao deletar PDF antigo:', error)
            }
          }
        }
        updateData.adoptionTermUrl = input.adoptionTermUrl
      }

      if (Object.keys(updateData).length > 0) {
        await db
          .update(adoptions)
          .set(updateData)
          .where(eq(adoptions.id, input.id))
      }

      return { success: true }
    }),

  /**
   * Exclui uma adoção e reverte o status do gato
   */
  delete: protectedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const orgId = requireOrgId(ctx.session.user)

      const [existingAdoption] = await db
        .select({
          id: adoptions.id,
          catId: adoptions.catId,
          adoptionTermUrl: adoptions.adoptionTermUrl,
        })
        .from(adoptions)
        .where(and(eq(adoptions.id, input.id), eq(adoptions.orgId, orgId)))

      if (!existingAdoption) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Adoção não encontrada',
        })
      }

      await db.transaction(async (tx) => {
        // Delete adoption record
        await tx.delete(adoptions).where(eq(adoptions.id, input.id))

        // Revert cat status to in_progress
        await tx
          .update(cats)
          .set({ status: 'in_progress' })
          .where(eq(cats.id, existingAdoption.catId))
      })

      // Delete PDF from R2 if exists
      if (existingAdoption.adoptionTermUrl) {
        const key = getKeyFromUrl(existingAdoption.adoptionTermUrl)
        if (key) {
          try {
            await deleteFile(key)
          } catch (error) {
            console.error('Erro ao deletar PDF da adoção:', error)
          }
        }
      }

      return { success: true }
    }),

  /**
   * Obtém URL presigned para upload de PDF do termo de adoção
   */
  getPresignedUrl: protectedProcedure
    .input(
      z.object({
        filename: z.string().min(1),
        contentType: z
          .string()
          .refine((type) => ALLOWED_PDF_TYPES.includes(type), {
            message: 'Apenas arquivos PDF são permitidos',
          }),
        fileSize: z.number(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      requireOrgId(ctx.session.user)

      if (input.fileSize > MAX_PDF_SIZE) {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: `Arquivo muito grande. Máximo: ${MAX_PDF_SIZE / 1024 / 1024}MB`,
        })
      }

      const key = generateAdoptionTermKey(input.filename)
      const presignedUrl = await getPresignedUploadUrl(key, input.contentType)

      return {
        presignedUrl,
        key,
      }
    }),

  /**
   * Confirma upload e retorna URL pública
   */
  confirmUpload: protectedProcedure
    .input(z.object({ key: z.string().min(1) }))
    .mutation(({ ctx, input }) => {
      requireOrgId(ctx.session.user)

      const publicUrl = getPublicUrl(input.key)
      return {
        publicUrl,
        key: input.key,
      }
    }),
})
