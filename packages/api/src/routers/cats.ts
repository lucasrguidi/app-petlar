import { db } from '@app-petlar/db'
import {
  adoptions,
  applicationFiles,
  applications,
  catGroups,
  catPhotos,
  cats,
  formFields,
  forms,
  orgs,
  type CatFormFieldSnapshot,
} from '@app-petlar/db/schema'
import { TRPCError } from '@trpc/server'
import { and, asc, desc, eq, inArray, isNull, like, sql } from 'drizzle-orm'
import { nanoid } from 'nanoid'
import { z } from 'zod'

import {
  adminProcedure,
  protectedProcedure,
  publicProcedure,
  router,
} from '../index'
import { deleteFile, getKeyFromUrl } from '../lib/r2'

// Schema base para criar gato
const catInputSchema = z.object({
  name: z.string().min(1).max(100),
  ageYears: z.number().int().min(0).max(30).nullable(),
  ageMonths: z.number().int().min(0).max(11).nullable(),
  sex: z.enum(['male', 'female']),
  fiv: z.enum(['positive', 'negative', 'not_tested']),
  felv: z.enum(['positive', 'negative', 'not_tested']),
  castrated: z.boolean(),
  vaccinated: z.boolean(),
  vaccinationNotes: z.string().nullable(),
  dewormed: z.boolean(),
  dewormingNotes: z.string().nullable(),
  description: z.string().nullable(),
  formId: z.string().min(1),
  donorName: z.string().nullable(),
  donorWhatsapp: z.string().nullable(),
})

// Schema para fotos
const photoSchema = z.object({
  url: z.string().url(),
  order: z.number().int().min(1).max(3),
})

// Schema de filtros para listagem
const listFiltersSchema = z.object({
  status: z.enum(['available', 'in_progress']).optional(),
  sex: z.enum(['male', 'female']).optional(),
  fiv: z.enum(['positive', 'negative', 'not_tested']).optional(),
  felv: z.enum(['positive', 'negative', 'not_tested']).optional(),
  castrated: z.boolean().optional(),
  search: z.string().optional(),
  page: z.number().int().min(1).default(1),
  limit: z.number().int().min(1).max(50).default(10),
})

const publicListFiltersSchema = z.object({
  slug: z.string().min(1),
  sex: z.enum(['male', 'female']).optional(),
  ageRange: z.enum(['kitten', 'young', 'adult', 'senior']).optional(),
  page: z.number().int().min(1).default(1),
  limit: z.number().int().min(1).max(200).default(9),
})

/**
 * Obtém o orgId do usuário da sessão
 * Lança erro se o usuário não pertencer a nenhuma org
 */
function requireOrgId(user: { orgId?: string | null }): string {
  if (!user.orgId) {
    throw new TRPCError({
      code: 'FORBIDDEN',
      message: 'Usuário não pertence a nenhuma organização',
    })
  }
  return user.orgId
}

/**
 * Valida se o formulário pertence à mesma organização.
 */
async function validateFormAccess(
  formId: string,
  orgId: string
): Promise<void> {
  const [form] = await db
    .select({ id: forms.id })
    .from(forms)
    .where(and(eq(forms.id, formId), eq(forms.orgId, orgId)))

  if (!form) {
    throw new TRPCError({
      code: 'BAD_REQUEST',
      message: 'Formulário inválido para esta organização',
    })
  }
}

async function buildCatFormSnapshot(
  formId: string
): Promise<CatFormFieldSnapshot[]> {
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
    .where(eq(formFields.formId, formId))
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

export const catsRouter = router({
  /**
   * Lista pública de gatos disponíveis por ONG.
   * Sempre retorna somente status "available".
   */
  listPublic: publicProcedure
    .input(publicListFiltersSchema)
    .query(async ({ input }) => {
      const { slug, sex, ageRange, page, limit } = input
      const offset = (page - 1) * limit

      const [org] = await db
        .select({ id: orgs.id })
        .from(orgs)
        .where(eq(orgs.slug, slug))

      if (!org) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Organização não encontrada',
        })
      }

      const conditions = [
        eq(cats.orgId, org.id),
        eq(cats.status, 'available'),
        isNull(cats.groupId),
      ]

      if (sex) {
        conditions.push(eq(cats.sex, sex))
      }

      if (ageRange) {
        const hasKnownAge = sql`(${cats.ageYears} is not null or ${cats.ageMonths} is not null)`
        const ageInMonths = sql<number>`(coalesce(${cats.ageYears}, 0) * 12 + coalesce(${cats.ageMonths}, 0))`

        conditions.push(hasKnownAge)

        if (ageRange === 'kitten') {
          conditions.push(sql`${ageInMonths} between 0 and 11`)
        } else if (ageRange === 'young') {
          conditions.push(sql`${ageInMonths} between 12 and 47`)
        } else if (ageRange === 'adult') {
          conditions.push(sql`${ageInMonths} between 48 and 95`)
        } else if (ageRange === 'senior') {
          conditions.push(sql`${ageInMonths} >= 96`)
        }
      }

      const catsList = await db
        .select({
          id: cats.id,
          formId: cats.formId,
          name: cats.name,
          ageYears: cats.ageYears,
          ageMonths: cats.ageMonths,
          sex: cats.sex,
          fiv: cats.fiv,
          felv: cats.felv,
          castrated: cats.castrated,
          vaccinated: cats.vaccinated,
          vaccinationNotes: cats.vaccinationNotes,
          dewormed: cats.dewormed,
          dewormingNotes: cats.dewormingNotes,
          description: cats.description,
          createdAt: cats.createdAt,
        })
        .from(cats)
        .where(and(...conditions))
        .orderBy(desc(cats.createdAt))
        .limit(limit)
        .offset(offset)

      const catIds = catsList.map((cat) => cat.id)
      const photos =
        catIds.length > 0
          ? await db
              .select({
                id: catPhotos.id,
                catId: catPhotos.catId,
                url: catPhotos.url,
                order: catPhotos.order,
              })
              .from(catPhotos)
              .where(sql`${catPhotos.catId} in ${catIds}`)
              .orderBy(catPhotos.catId, catPhotos.order)
          : []

      const photosByCatId = photos.reduce<
        Record<string, Array<{ id: string; url: string; order: number }>>
      >((acc, photo) => {
        if (!acc[photo.catId]) {
          acc[photo.catId] = []
        }
        acc[photo.catId]?.push({
          id: photo.id,
          url: photo.url,
          order: photo.order,
        })
        return acc
      }, {})

      const [countResult] = await db
        .select({ count: sql<number>`count(*)` })
        .from(cats)
        .where(and(...conditions))

      const total = countResult?.count ?? 0

      return {
        cats: catsList.map((cat) => {
          const catPhotosList = photosByCatId[cat.id] ?? []
          return {
            ...cat,
            photoUrl: catPhotosList[0]?.url ?? null,
            photos: catPhotosList,
          }
        }),
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit),
        },
      }
    }),

  /**
   * Lista gatos com filtros e paginação
   */
  list: protectedProcedure
    .input(listFiltersSchema)
    .query(async ({ ctx, input }) => {
      const { status, sex, fiv, felv, castrated, search, page, limit } = input
      const orgId = requireOrgId(ctx.session.user)
      const offset = (page - 1) * limit

      // Construir condições de filtro
      const conditions = [
        eq(cats.orgId, orgId),
        inArray(cats.status, ['available', 'in_progress']),
      ]

      if (status) {
        conditions.push(eq(cats.status, status))
      }
      if (sex) {
        conditions.push(eq(cats.sex, sex))
      }
      if (fiv) {
        conditions.push(eq(cats.fiv, fiv))
      }
      if (felv) {
        conditions.push(eq(cats.felv, felv))
      }
      if (castrated !== undefined) {
        conditions.push(eq(cats.castrated, castrated))
      }
      if (search) {
        conditions.push(like(cats.name, `%${search}%`))
      }

      // Buscar gatos
      const catsList = await db
        .select({
          id: cats.id,
          formId: cats.formId,
          formName: forms.name,
          groupId: cats.groupId,
          name: cats.name,
          ageYears: cats.ageYears,
          ageMonths: cats.ageMonths,
          sex: cats.sex,
          fiv: cats.fiv,
          felv: cats.felv,
          castrated: cats.castrated,
          vaccinated: cats.vaccinated,
          dewormed: cats.dewormed,
          description: cats.description,
          donorName: cats.donorName,
          donorWhatsapp: cats.donorWhatsapp,
          status: cats.status,
          createdAt: cats.createdAt,
        })
        .from(cats)
        .leftJoin(forms, and(eq(cats.formId, forms.id), eq(forms.orgId, orgId)))
        .where(and(...conditions))
        .orderBy(desc(cats.createdAt))
        .limit(limit)
        .offset(offset)

      // Buscar fotos para cada gato da página atual
      const catIds = catsList.map((c) => c.id)
      const photos =
        catIds.length > 0
          ? await db
              .select({
                id: catPhotos.id,
                catId: catPhotos.catId,
                url: catPhotos.url,
                order: catPhotos.order,
              })
              .from(catPhotos)
              .where(sql`${catPhotos.catId} IN ${catIds}`)
              .orderBy(catPhotos.catId, catPhotos.order)
          : []

      const photosByCatId = photos.reduce<
        Record<string, Array<{ id: string; url: string; order: number }>>
      >((acc, photo) => {
        if (!acc[photo.catId]) {
          acc[photo.catId] = []
        }
        acc[photo.catId]?.push({
          id: photo.id,
          url: photo.url,
          order: photo.order,
        })
        return acc
      }, {})

      const interestedCounts =
        catIds.length > 0
          ? await db
              .select({
                catId: applications.catId,
                count: sql<number>`count(*)`,
                pendingCount: sql<number>`sum(case when ${applications.status} = 'pending' then 1 else 0 end)`,
              })
              .from(applications)
              .where(
                and(
                  eq(applications.orgId, orgId),
                  inArray(applications.catId, catIds),
                  sql`${applications.confirmedAt} is not null`
                )
              )
              .groupBy(applications.catId)
          : []

      const interestedCountByCatId = new Map(
        interestedCounts.map((item) => [
          item.catId,
          { count: item.count, pendingCount: item.pendingCount },
        ])
      )

      const groupIds = [
        ...new Set(
          catsList
            .map((c) => c.groupId)
            .filter((g): g is string => g !== null)
        ),
      ]

      const groupInterestedCounts =
        groupIds.length > 0
          ? await db
              .select({
                groupId: applications.groupId,
                count: sql<number>`count(*)`,
                pendingCount: sql<number>`sum(case when ${applications.status} = 'pending' then 1 else 0 end)`,
              })
              .from(applications)
              .where(
                and(
                  eq(applications.orgId, orgId),
                  inArray(applications.groupId, groupIds),
                  sql`${applications.confirmedAt} is not null`
                )
              )
              .groupBy(applications.groupId)
          : []

      const interestedCountByGroupId = new Map(
        groupInterestedCounts.map((item) => [
          item.groupId,
          { count: item.count, pendingCount: item.pendingCount },
        ])
      )

      // Contar total para paginação
      const [countResult] = await db
        .select({ count: sql<number>`count(*)` })
        .from(cats)
        .where(and(...conditions))

      const total = countResult?.count ?? 0

      return {
        cats: catsList.map((cat) => {
          const catPhotosList = photosByCatId[cat.id] ?? []
          const individualCounts = interestedCountByCatId.get(cat.id)
          const groupCounts = cat.groupId
            ? interestedCountByGroupId.get(cat.groupId)
            : undefined
          return {
            ...cat,
            photoUrl: catPhotosList[0]?.url ?? null,
            photos: catPhotosList,
            interestedCount:
              (individualCounts?.count ?? 0) + (groupCounts?.count ?? 0),
            pendingApplicationsCount:
              (individualCounts?.pendingCount ?? 0) +
              (groupCounts?.pendingCount ?? 0),
          }
        }),
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit),
        },
      }
    }),

  /**
   * Busca gato por ID com todas as fotos
   */
  getById: protectedProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ ctx, input }) => {
      const orgId = requireOrgId(ctx.session.user)

      const [cat] = await db
        .select({
          id: cats.id,
          orgId: cats.orgId,
          formId: cats.formId,
          formName: forms.name,
          name: cats.name,
          ageYears: cats.ageYears,
          ageMonths: cats.ageMonths,
          sex: cats.sex,
          fiv: cats.fiv,
          felv: cats.felv,
          castrated: cats.castrated,
          vaccinated: cats.vaccinated,
          vaccinationNotes: cats.vaccinationNotes,
          dewormed: cats.dewormed,
          dewormingNotes: cats.dewormingNotes,
          description: cats.description,
          donorName: cats.donorName,
          donorWhatsapp: cats.donorWhatsapp,
          groupId: cats.groupId,
          status: cats.status,
          createdBy: cats.createdBy,
          createdAt: cats.createdAt,
          updatedAt: cats.updatedAt,
        })
        .from(cats)
        .leftJoin(forms, and(eq(cats.formId, forms.id), eq(forms.orgId, orgId)))
        .where(and(eq(cats.id, input.id), eq(cats.orgId, orgId)))

      if (!cat) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Gato não encontrado',
        })
      }

      const photos = await db
        .select({
          id: catPhotos.id,
          url: catPhotos.url,
          order: catPhotos.order,
        })
        .from(catPhotos)
        .where(eq(catPhotos.catId, cat.id))
        .orderBy(catPhotos.order)

      return {
        ...cat,
        photos,
      }
    }),

  /**
   * Cria um novo gato
   */
  create: protectedProcedure
    .input(
      z.object({
        cat: catInputSchema,
        photos: z.array(photoSchema).max(3).optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const orgId = requireOrgId(ctx.session.user)
      const catId = nanoid()
      await validateFormAccess(input.cat.formId, orgId)
      const formSnapshot = await buildCatFormSnapshot(input.cat.formId)

      await db.transaction(async (tx) => {
        // Inserir gato
        await tx.insert(cats).values({
          id: catId,
          orgId,
          createdBy: ctx.session.user.id,
          formSnapshot,
          ...input.cat,
        })

        // Inserir fotos se houver
        if (input.photos && input.photos.length > 0) {
          await tx.insert(catPhotos).values(
            input.photos.map((photo) => ({
              id: nanoid(),
              catId,
              url: photo.url,
              order: photo.order,
            }))
          )
        }
      })

      return { id: catId }
    }),

  /**
   * Atualiza um gato existente
   */
  update: protectedProcedure
    .input(
      z.object({
        id: z.string(),
        cat: catInputSchema.partial(),
        photos: z.array(photoSchema).max(3).optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const orgId = requireOrgId(ctx.session.user)

      // Verificar se gato existe e pertence à org
      const [existingCat] = await db
        .select({ id: cats.id, formId: cats.formId })
        .from(cats)
        .where(and(eq(cats.id, input.id), eq(cats.orgId, orgId)))

      if (!existingCat) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Gato não encontrado',
        })
      }

      if (
        input.cat.formId !== undefined &&
        input.cat.formId !== existingCat.formId
      ) {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: 'Não é permitido trocar o formulário após criar o gato',
        })
      }

      await db.transaction(async (tx) => {
        // Atualizar dados do gato se houver
        if (Object.keys(input.cat).length > 0) {
          await tx.update(cats).set(input.cat).where(eq(cats.id, input.id))
        }

        // Sincronizar fotos se fornecidas
        if (input.photos !== undefined) {
          // Remover fotos antigas
          await tx.delete(catPhotos).where(eq(catPhotos.catId, input.id))

          // Inserir novas fotos
          if (input.photos.length > 0) {
            await tx.insert(catPhotos).values(
              input.photos.map((photo) => ({
                id: nanoid(),
                catId: input.id,
                url: photo.url,
                order: photo.order,
              }))
            )
          }
        }
      })

      return { success: true }
    }),

  /**
   * Exclui um gato (fotos são deletadas por cascade)
   */
  delete: protectedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const orgId = requireOrgId(ctx.session.user)

      const [existingCat] = await db
        .select({ id: cats.id, status: cats.status, groupId: cats.groupId })
        .from(cats)
        .where(and(eq(cats.id, input.id), eq(cats.orgId, orgId)))

      if (!existingCat) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Gato não encontrado',
        })
      }

      if (existingCat.status === 'adopted') {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: 'Não é possível excluir um gato já adotado',
        })
      }

      await db.delete(cats).where(eq(cats.id, input.id))

      if (existingCat.groupId) {
        const remaining = await db
          .select({ id: cats.id })
          .from(cats)
          .where(eq(cats.groupId, existingCat.groupId))

        if (remaining.length < 2) {
          if (remaining.length === 1) {
            await db
              .update(cats)
              .set({ groupId: null })
              .where(eq(cats.id, remaining[0]!.id))
          }
          await db
            .delete(catGroups)
            .where(eq(catGroups.id, existingCat.groupId))
        }
      }

      return { success: true }
    }),

  /**
   * Exclui definitivamente um gato e todos os registros/arquivos vinculados.
   */
  hardDelete: adminProcedure
    .input(
      z.object({
        id: z.string().min(1),
        confirmationName: z.string().trim().min(1),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const orgId = requireOrgId(ctx.session.user)

      const [existingCat] = await db
        .select({ id: cats.id, name: cats.name })
        .from(cats)
        .where(and(eq(cats.id, input.id), eq(cats.orgId, orgId)))
        .limit(1)

      if (!existingCat) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Gato não encontrado',
        })
      }

      if (
        existingCat.name.trim().toLocaleLowerCase('pt-BR') !==
        input.confirmationName.trim().toLocaleLowerCase('pt-BR')
      ) {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: 'O nome digitado não corresponde ao nome do gato',
        })
      }

      const [photos, adoptionRows, applicationRows] = await Promise.all([
        db
          .select({ url: catPhotos.url })
          .from(catPhotos)
          .where(eq(catPhotos.catId, input.id)),
        db
          .select({ adoptionTermUrl: adoptions.adoptionTermUrl })
          .from(adoptions)
          .where(eq(adoptions.catId, input.id)),
        db
          .select({ id: applications.id })
          .from(applications)
          .where(eq(applications.catId, input.id)),
      ])

      const applicationIds = applicationRows.map(
        (application) => application.id
      )
      const files =
        applicationIds.length > 0
          ? await db
              .select({ url: applicationFiles.url })
              .from(applicationFiles)
              .where(inArray(applicationFiles.applicationId, applicationIds))
          : []

      const linkedUrls = [
        ...photos.map((photo) => photo.url),
        ...files.map((file) => file.url),
        ...adoptionRows.flatMap((adoption) =>
          adoption.adoptionTermUrl ? [adoption.adoptionTermUrl] : []
        ),
      ]
      const storageKeys = [
        ...new Set(
          linkedUrls
            .map((url) => getKeyFromUrl(url))
            .filter((key): key is string => Boolean(key))
        ),
      ]

      try {
        await Promise.all(storageKeys.map((key) => deleteFile(key)))
      } catch (error) {
        console.error('Erro ao limpar arquivos do gato:', error)
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message:
            'Não foi possível remover todos os arquivos. Nenhum registro foi apagado; tente novamente.',
        })
      }

      await db.transaction(async (tx) => {
        await tx.delete(cats).where(eq(cats.id, input.id))
      })

      return { success: true, deletedFileCount: storageKeys.length }
    }),

  /**
   * Duplica um gato (copia dados, sem fotos)
   */
  duplicate: protectedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const orgId = requireOrgId(ctx.session.user)

      // Buscar gato original
      const [originalCat] = await db
        .select()
        .from(cats)
        .where(and(eq(cats.id, input.id), eq(cats.orgId, orgId)))

      if (!originalCat) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Gato não encontrado',
        })
      }

      if (originalCat.status === 'adopted') {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: 'Não é possível duplicar um gato já adotado',
        })
      }

      const newCatId = nanoid()
      const formSnapshot =
        originalCat.formSnapshot ??
        (await buildCatFormSnapshot(originalCat.formId))

      // Criar cópia com novo ID e nome modificado
      await db.insert(cats).values({
        id: newCatId,
        orgId,
        formId: originalCat.formId,
        formSnapshot,
        name: `${originalCat.name} (cópia)`,
        ageYears: originalCat.ageYears,
        ageMonths: originalCat.ageMonths,
        sex: originalCat.sex,
        fiv: originalCat.fiv,
        felv: originalCat.felv,
        castrated: originalCat.castrated,
        vaccinated: originalCat.vaccinated,
        vaccinationNotes: originalCat.vaccinationNotes,
        dewormed: originalCat.dewormed,
        dewormingNotes: originalCat.dewormingNotes,
        description: originalCat.description,
        donorName: originalCat.donorName,
        donorWhatsapp: originalCat.donorWhatsapp,
        status: 'available',
        createdBy: ctx.session.user.id,
      })

      return { id: newCatId }
    }),

  /**
   * Atualiza apenas o status do gato
   * Valida transições permitidas
   */
  updateStatus: protectedProcedure
    .input(
      z.object({
        id: z.string(),
        status: z.enum(['available', 'in_progress']),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const orgId = requireOrgId(ctx.session.user)

      // Buscar gato atual
      const [existingCat] = await db
        .select({ id: cats.id, status: cats.status })
        .from(cats)
        .where(and(eq(cats.id, input.id), eq(cats.orgId, orgId)))

      if (!existingCat) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Gato não encontrado',
        })
      }

      // Validar transições de status
      const currentStatus = existingCat.status
      const newStatus = input.status

      // Se já está adotado, não permite mudança
      if (currentStatus === 'adopted') {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: 'Não é possível alterar o status de um gato já adotado',
        })
      }

      // Validar transições válidas
      const validTransitions: Record<string, string[]> = {
        available: ['in_progress'],
        in_progress: ['available'],
      }

      if (!validTransitions[currentStatus]?.includes(newStatus)) {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: `Transição de status inválida: ${currentStatus} → ${newStatus}`,
        })
      }

      await db
        .update(cats)
        .set({ status: newStatus })
        .where(eq(cats.id, input.id))

      return { success: true }
    }),
})
