import { db } from '@app-petlar/db'
import {
  adoptions,
  applications,
  catGroups,
  catPhotos,
  cats,
} from '@app-petlar/db/schema'
import { TRPCError } from '@trpc/server'
import {
  and,
  desc,
  eq,
  gte,
  inArray,
  lte,
  notInArray,
  or,
  sql,
} from 'drizzle-orm'
import { nanoid } from 'nanoid'
import { z } from 'zod'

import { protectedProcedure, router } from '../index'
import { wipeAllCatApplications } from '../lib/media-retention'
import {
  deleteFile,
  generateAdoptionTermKey,
  getKeyFromUrl,
  getPresignedUploadUrl,
  getPublicUrl,
} from '../lib/r2'
import { isPastRetentionWindow } from '../lib/retention-window'

const ALLOWED_PDF_TYPES = ['application/pdf']
const MAX_PDF_SIZE = 10 * 1024 * 1024 // 10MB

/**
 * Clear the candidate list of a cat returned after the retention window.
 *
 * Deliberately runs after the return transaction commits and swallows errors:
 * a few lingering applications are a benign, fixable state, whereas losing them
 * because the return itself failed would not be recoverable.
 */
async function wipeReturnedCatApplications(
  catId: string,
  groupId: string | null
) {
  try {
    await wipeAllCatApplications(catId, groupId)
  } catch (error) {
    console.error('Erro ao limpar candidaturas do gato devolvido', {
      catId,
      groupId,
      error,
    })
  }
}

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

const createAdoptionSchema = z
  .object({
    catId: z.string().min(1).optional(),
    groupId: z.string().min(1).optional(),
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
  .refine((data) => data.catId || data.groupId, {
    message: 'catId ou groupId é obrigatório',
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
   * Lista candidatos confirmados e não rejeitados de um gato para seleção no modal de adoção
   */
  getEligibleApplicants: protectedProcedure
    .input(
      z.object({
        catId: z.string().optional(),
        groupId: z.string().optional(),
      })
    )
    .query(async ({ ctx, input }) => {
      const orgId = requireOrgId(ctx.session.user)

      if (input.groupId) {
        const [group] = await db
          .select({ id: catGroups.id })
          .from(catGroups)
          .where(
            and(eq(catGroups.id, input.groupId), eq(catGroups.orgId, orgId))
          )

        if (!group) {
          throw new TRPCError({
            code: 'NOT_FOUND',
            message: 'Grupo não encontrado',
          })
        }

        const groupCats = await db
          .select({ id: cats.id, name: cats.name })
          .from(cats)
          .where(eq(cats.groupId, input.groupId))

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
              eq(applications.groupId, input.groupId),
              sql`${applications.confirmedAt} is not null`,
              notInArray(applications.status, [
                'rejected',
                'permanently_rejected',
              ])
            )
          )
          .orderBy(desc(applications.createdAt))

        return {
          cat: null,
          group: {
            id: group.id,
            cats: groupCats,
          },
          applicants,
        }
      }

      if (!input.catId) {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: 'catId ou groupId é obrigatório',
        })
      }

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
            notInArray(applications.status, [
              'rejected',
              'permanently_rejected',
            ])
          )
        )
        .orderBy(desc(applications.createdAt))

      return {
        cat: { id: cat.id, name: cat.name },
        group: null,
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
      const normalizedAdopterName = normalizeSearchText(input.adopterName)

      if (input.groupId) {
        const [group] = await db
          .select({ id: catGroups.id })
          .from(catGroups)
          .where(
            and(eq(catGroups.id, input.groupId), eq(catGroups.orgId, orgId))
          )

        if (!group) {
          throw new TRPCError({
            code: 'NOT_FOUND',
            message: 'Grupo não encontrado',
          })
        }

        const groupCats = await db
          .select({ id: cats.id, status: cats.status })
          .from(cats)
          .where(eq(cats.groupId, input.groupId))

        if (groupCats.some((c) => c.status === 'adopted')) {
          throw new TRPCError({
            code: 'BAD_REQUEST',
            message: 'Um ou mais gatos do grupo já foram adotados',
          })
        }

        const catIds = groupCats.map((c) => c.id)

        const existingAdoptions = await db
          .select({ id: adoptions.id })
          .from(adoptions)
          .where(inArray(adoptions.catId, catIds))

        if (existingAdoptions.length > 0) {
          throw new TRPCError({
            code: 'BAD_REQUEST',
            message:
              'Já existe registro de adoção para um ou mais gatos do grupo',
          })
        }

        if (input.applicationId) {
          const [application] = await db
            .select({ id: applications.id, status: applications.status })
            .from(applications)
            .where(
              and(
                eq(applications.id, input.applicationId),
                eq(applications.orgId, orgId),
                eq(applications.groupId, input.groupId),
                sql`${applications.confirmedAt} is not null`
              )
            )

          if (!application) {
            throw new TRPCError({
              code: 'BAD_REQUEST',
              message:
                'Candidatura não encontrada ou não pertence a este grupo',
            })
          }

          if (
            application.status === 'rejected' ||
            application.status === 'permanently_rejected'
          ) {
            throw new TRPCError({
              code: 'BAD_REQUEST',
              message: 'Candidatura rejeitada não pode ser selecionada',
            })
          }
        }

        const adoptionIds: string[] = []

        await db.transaction(async (tx) => {
          for (const catId of catIds) {
            const adoptionId = nanoid()
            adoptionIds.push(adoptionId)

            await tx.insert(adoptions).values({
              id: adoptionId,
              orgId,
              catId,
              groupId: input.groupId,
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
          }

          await tx
            .update(cats)
            .set({ status: 'adopted' })
            .where(inArray(cats.id, catIds))
        })

        return { ids: adoptionIds }
      }

      const singleCatId = input.catId
      if (!singleCatId) {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: 'catId ou groupId é obrigatório',
        })
      }

      const [cat] = await db
        .select({ id: cats.id, status: cats.status })
        .from(cats)
        .where(and(eq(cats.id, singleCatId), eq(cats.orgId, orgId)))

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

      const [existingAdoption] = await db
        .select({ id: adoptions.id })
        .from(adoptions)
        .where(eq(adoptions.catId, singleCatId))

      if (existingAdoption) {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: 'Já existe um registro de adoção para este gato',
        })
      }

      if (input.applicationId) {
        const [application] = await db
          .select({ id: applications.id, status: applications.status })
          .from(applications)
          .where(
            and(
              eq(applications.id, input.applicationId),
              eq(applications.orgId, orgId),
              eq(applications.catId, singleCatId),
              sql`${applications.confirmedAt} is not null`
            )
          )

        if (!application) {
          throw new TRPCError({
            code: 'BAD_REQUEST',
            message: 'Candidatura não encontrada ou não pertence a este gato',
          })
        }

        if (
          application.status === 'rejected' ||
          application.status === 'permanently_rejected'
        ) {
          throw new TRPCError({
            code: 'BAD_REQUEST',
            message: 'Candidatura rejeitada não pode ser selecionada',
          })
        }
      }

      const adoptionId = nanoid()

      await db.transaction(async (tx) => {
        await tx.insert(adoptions).values({
          id: adoptionId,
          orgId,
          catId: singleCatId,
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

        await tx
          .update(cats)
          .set({ status: 'adopted' })
          .where(eq(cats.id, singleCatId))
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
   * Exclui uma adoção e devolve o gato para a lista pública
   */
  returnToAvailable: protectedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const orgId = requireOrgId(ctx.session.user)

      const [existingAdoption] = await db
        .select({
          id: adoptions.id,
          catId: adoptions.catId,
          groupId: adoptions.groupId,
          adoptionDate: adoptions.adoptionDate,
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

      // Past the retention window the losing applications are already gone and
      // the adopter is no longer relevant, so the cat goes back to the public
      // list with an empty candidate list. This is the source of truth
      // regardless of whether the cron has run yet.
      const isLateReturn = isPastRetentionWindow(existingAdoption.adoptionDate)

      if (existingAdoption.groupId) {
        const groupAdoptions = await db
          .select({
            id: adoptions.id,
            catId: adoptions.catId,
            adoptionTermUrl: adoptions.adoptionTermUrl,
          })
          .from(adoptions)
          .where(eq(adoptions.groupId, existingAdoption.groupId))

        const termUrls = groupAdoptions
          .map((a) => a.adoptionTermUrl)
          .filter((url): url is string => Boolean(url))
        const uniqueTermUrls = [...new Set(termUrls)]

        for (const termUrl of uniqueTermUrls) {
          const key = getKeyFromUrl(termUrl)
          if (key) {
            try {
              await deleteFile(key)
            } catch (error) {
              console.error('Erro ao deletar PDF da adoção:', error)
              throw new TRPCError({
                code: 'INTERNAL_SERVER_ERROR',
                message:
                  'Não foi possível remover os termos. Nenhum registro foi alterado; tente novamente.',
              })
            }
          }
        }

        const catIds = groupAdoptions.map((a) => a.catId)
        const adoptionIds = groupAdoptions.map((a) => a.id)

        await db.transaction(async (tx) => {
          await tx.delete(adoptions).where(inArray(adoptions.id, adoptionIds))

          await tx
            .update(cats)
            .set({ status: 'available' })
            .where(inArray(cats.id, catIds))
        })

        if (isLateReturn) {
          await wipeReturnedCatApplications(
            existingAdoption.catId,
            existingAdoption.groupId
          )
        }

        return { success: true, returnedCount: catIds.length }
      }

      if (existingAdoption.adoptionTermUrl) {
        const key = getKeyFromUrl(existingAdoption.adoptionTermUrl)
        if (key) {
          try {
            await deleteFile(key)
          } catch (error) {
            console.error('Erro ao deletar PDF da adoção:', error)
            throw new TRPCError({
              code: 'INTERNAL_SERVER_ERROR',
              message:
                'Não foi possível remover o termo. Nenhum registro foi alterado; tente novamente.',
            })
          }
        }
      }

      await db.transaction(async (tx) => {
        await tx.delete(adoptions).where(eq(adoptions.id, input.id))

        await tx
          .update(cats)
          .set({ status: 'available' })
          .where(eq(cats.id, existingAdoption.catId))
      })

      if (isLateReturn) {
        await wipeReturnedCatApplications(existingAdoption.catId, null)
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

  discardTermUpload: protectedProcedure
    .input(z.object({ url: z.string().url() }))
    .mutation(async ({ ctx, input }) => {
      const orgId = requireOrgId(ctx.session.user)

      const key = getKeyFromUrl(input.url)
      if (!key || !key.startsWith('adoption-terms/')) {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: 'URL de termo inválida',
        })
      }

      const [committedTerm] = await db
        .select({ id: adoptions.id })
        .from(adoptions)
        .where(
          and(
            eq(adoptions.orgId, orgId),
            eq(adoptions.adoptionTermUrl, input.url)
          )
        )
        .limit(1)

      if (committedTerm) {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: 'Um termo já vinculado a uma adoção não pode ser descartado',
        })
      }

      await deleteFile(key)
      return { success: true }
    }),
})
