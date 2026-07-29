import { db } from '@app-petlar/db'
import {
  applications,
  catGroupPhotos,
  catGroups,
  catPhotos,
  cats,
  formFields,
  forms,
  orgs,
  type CatFormFieldSnapshot,
} from '@app-petlar/db/schema'
import { TRPCError } from '@trpc/server'
import { and, asc, eq, inArray, sql } from 'drizzle-orm'
import { nanoid } from 'nanoid'
import { z } from 'zod'

import { protectedProcedure, publicProcedure, router } from '../index'
import { deleteFile, getKeyFromUrl } from '../lib/r2'

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
  photos: z
    .array(
      z.object({
        url: z.string().url(),
        order: z.number().int().min(1).max(3),
      })
    )
    .max(3)
    .optional(),
})

const groupPhotoSchema = z.object({
  url: z.string().url(),
  order: z.number().int().min(1).max(5),
})

const createGroupSchema = z.object({
  formId: z.string().min(1),
  description: z.string().nullish(),
  donorName: z.string().nullable().optional(),
  donorWhatsapp: z.string().nullable().optional(),
  photos: z.array(groupPhotoSchema).max(5).optional(),
  newCats: z
    .array(
      catInputSchema.omit({ formId: true }).extend({
        photos: z
          .array(
            z.object({
              url: z.string().url(),
              order: z.number().int().min(1).max(3),
            })
          )
          .max(3)
          .optional(),
      })
    )
    .optional()
    .default([]),
  existingCatIds: z.array(z.string().min(1)).optional().default([]),
})

const updateGroupSchema = z.object({
  id: z.string().min(1),
  description: z.string().nullish(),
  formId: z.string().min(1).optional(),
  donorName: z.string().nullable().optional(),
  donorWhatsapp: z.string().nullable().optional(),
  photos: z.array(groupPhotoSchema).max(5).optional(),
  addCatIds: z.array(z.string().min(1)).optional(),
  removeCatIds: z.array(z.string().min(1)).optional(),
  newCats: z
    .array(
      catInputSchema.omit({ formId: true }).extend({
        photos: z
          .array(
            z.object({
              url: z.string().url(),
              order: z.number().int().min(1).max(3),
            })
          )
          .max(3)
          .optional(),
      })
    )
    .optional(),
})

const publicListFiltersSchema = z.object({
  slug: z.string().min(1),
  sex: z.enum(['male', 'female']).optional(),
  ageRange: z.enum(['kitten', 'young', 'adult', 'senior']).optional(),
  page: z.number().int().min(1).default(1),
  limit: z.number().int().min(1).max(200).default(9),
})

function requireOrgId(user: { orgId?: string | null }): string {
  if (!user.orgId) {
    throw new TRPCError({
      code: 'FORBIDDEN',
      message: 'Usuário não pertence a nenhuma organização',
    })
  }
  return user.orgId
}

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

async function buildFormSnapshot(
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

export const catGroupsRouter = router({
  create: protectedProcedure
    .input(createGroupSchema)
    .mutation(async ({ ctx, input }) => {
      const orgId = requireOrgId(ctx.session.user)
      const userId = ctx.session.user.id

      const totalCats = input.newCats.length + input.existingCatIds.length
      if (totalCats < 2) {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: 'Um grupo precisa ter pelo menos 2 gatos',
        })
      }

      await validateFormAccess(input.formId, orgId)
      const formSnapshot = await buildFormSnapshot(input.formId)

      if (input.existingCatIds.length > 0) {
        const existingCats = await db
          .select({
            id: cats.id,
            status: cats.status,
            groupId: cats.groupId,
          })
          .from(cats)
          .where(
            and(
              eq(cats.orgId, orgId),
              inArray(cats.id, input.existingCatIds)
            )
          )

        if (existingCats.length !== input.existingCatIds.length) {
          throw new TRPCError({
            code: 'BAD_REQUEST',
            message: 'Um ou mais gatos não foram encontrados',
          })
        }

        for (const cat of existingCats) {
          if (cat.status !== 'available') {
            throw new TRPCError({
              code: 'BAD_REQUEST',
              message:
                'Apenas gatos disponíveis podem ser adicionados a um grupo',
            })
          }
          if (cat.groupId) {
            throw new TRPCError({
              code: 'BAD_REQUEST',
              message: 'Um dos gatos já pertence a outro grupo',
            })
          }
        }
      }

      const groupId = nanoid()

      await db.transaction(async (tx) => {
        await tx.insert(catGroups).values({
          id: groupId,
          orgId,
          formId: input.formId,
          formSnapshot,
          description: input.description ?? null,
          createdBy: userId,
        })

        if (input.existingCatIds.length > 0) {
          const existingUpdate: Record<string, unknown> = { groupId }
          if (input.donorName !== undefined)
            existingUpdate.donorName = input.donorName
          if (input.donorWhatsapp !== undefined)
            existingUpdate.donorWhatsapp = input.donorWhatsapp
          await tx
            .update(cats)
            .set(existingUpdate)
            .where(inArray(cats.id, input.existingCatIds))
        }

        for (const newCat of input.newCats) {
          const catId = nanoid()
          const { photos, ...catData } = newCat

          await tx.insert(cats).values({
            id: catId,
            orgId,
            groupId,
            formId: input.formId,
            formSnapshot,
            createdBy: userId,
            ...catData,
          })

          if (photos && photos.length > 0) {
            await tx.insert(catPhotos).values(
              photos.map((photo) => ({
                id: nanoid(),
                catId,
                url: photo.url,
                order: photo.order,
              }))
            )
          }
        }

        if (input.photos && input.photos.length > 0) {
          await tx.insert(catGroupPhotos).values(
            input.photos.map((photo) => ({
              id: nanoid(),
              groupId,
              url: photo.url,
              order: photo.order,
            }))
          )
        }
      })

      return { id: groupId }
    }),

  getById: protectedProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ ctx, input }) => {
      const orgId = requireOrgId(ctx.session.user)

      const [group] = await db
        .select({
          id: catGroups.id,
          description: catGroups.description,
          formId: catGroups.formId,
          formName: forms.name,
          createdAt: catGroups.createdAt,
          updatedAt: catGroups.updatedAt,
        })
        .from(catGroups)
        .leftJoin(forms, eq(catGroups.formId, forms.id))
        .where(and(eq(catGroups.id, input.id), eq(catGroups.orgId, orgId)))

      if (!group) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Grupo não encontrado',
        })
      }

      const groupCats = await db
        .select({
          id: cats.id,
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
          status: cats.status,
          createdAt: cats.createdAt,
        })
        .from(cats)
        .where(eq(cats.groupId, input.id))
        .orderBy(asc(cats.createdAt))

      const catIds = groupCats.map((c) => c.id)
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

      const groupPhotos = await db
        .select({
          id: catGroupPhotos.id,
          url: catGroupPhotos.url,
          order: catGroupPhotos.order,
        })
        .from(catGroupPhotos)
        .where(eq(catGroupPhotos.groupId, input.id))
        .orderBy(catGroupPhotos.order)

      return {
        ...group,
        photos: groupPhotos,
        cats: groupCats.map((cat) => ({
          ...cat,
          photos: photosByCatId[cat.id] ?? [],
        })),
      }
    }),

  update: protectedProcedure
    .input(updateGroupSchema)
    .mutation(async ({ ctx, input }) => {
      const orgId = requireOrgId(ctx.session.user)
      const userId = ctx.session.user.id

      const [group] = await db
        .select({ id: catGroups.id, formId: catGroups.formId })
        .from(catGroups)
        .where(and(eq(catGroups.id, input.id), eq(catGroups.orgId, orgId)))

      if (!group) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Grupo não encontrado',
        })
      }

      const currentCats = await db
        .select({ id: cats.id })
        .from(cats)
        .where(eq(cats.groupId, input.id))

      const currentCatIds = new Set(currentCats.map((c) => c.id))
      const removeIds = new Set(input.removeCatIds ?? [])
      const addIds = input.addCatIds ?? []
      const newCatsCount = input.newCats?.length ?? 0

      const remainingCount =
        currentCatIds.size -
        removeIds.size +
        addIds.length +
        newCatsCount

      if (remainingCount < 2) {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message:
            'O grupo precisa manter pelo menos 2 gatos. Para remover todos, use a ação de desmembrar.',
        })
      }

      if (input.formId && input.formId !== group.formId) {
        await validateFormAccess(input.formId, orgId)
      }

      if (addIds.length > 0) {
        const catsToAdd = await db
          .select({ id: cats.id, status: cats.status, groupId: cats.groupId })
          .from(cats)
          .where(and(eq(cats.orgId, orgId), inArray(cats.id, addIds)))

        if (catsToAdd.length !== addIds.length) {
          throw new TRPCError({
            code: 'BAD_REQUEST',
            message: 'Um ou mais gatos não foram encontrados',
          })
        }

        for (const cat of catsToAdd) {
          if (cat.status !== 'available') {
            throw new TRPCError({
              code: 'BAD_REQUEST',
              message:
                'Apenas gatos disponíveis podem ser adicionados a um grupo',
            })
          }
          if (cat.groupId && cat.groupId !== input.id) {
            throw new TRPCError({
              code: 'BAD_REQUEST',
              message: 'Um dos gatos já pertence a outro grupo',
            })
          }
        }
      }

      await db.transaction(async (tx) => {
        const updateData: Record<string, unknown> = {}

        if (input.formId && input.formId !== group.formId) {
          const formSnapshot = await buildFormSnapshot(input.formId)
          updateData.formId = input.formId
          updateData.formSnapshot = formSnapshot
        }

        if (input.description !== undefined) {
          updateData.description = input.description ?? null
        }

        if (Object.keys(updateData).length > 0) {
          await tx
            .update(catGroups)
            .set(updateData)
            .where(eq(catGroups.id, input.id))
        }

        if (input.donorName !== undefined || input.donorWhatsapp !== undefined) {
          const donorUpdate: Record<string, unknown> = {}
          if (input.donorName !== undefined)
            donorUpdate.donorName = input.donorName
          if (input.donorWhatsapp !== undefined)
            donorUpdate.donorWhatsapp = input.donorWhatsapp
          await tx
            .update(cats)
            .set(donorUpdate)
            .where(eq(cats.groupId, input.id))
        }

        if (removeIds.size > 0) {
          await tx
            .update(cats)
            .set({ groupId: null })
            .where(
              and(
                eq(cats.groupId, input.id),
                inArray(cats.id, [...removeIds])
              )
            )
        }

        if (addIds.length > 0) {
          const addUpdate: Record<string, unknown> = { groupId: input.id }
          if (input.donorName !== undefined)
            addUpdate.donorName = input.donorName
          if (input.donorWhatsapp !== undefined)
            addUpdate.donorWhatsapp = input.donorWhatsapp
          await tx
            .update(cats)
            .set(addUpdate)
            .where(inArray(cats.id, addIds))
        }

        if (input.newCats && input.newCats.length > 0) {
          const effectiveFormId = input.formId ?? group.formId
          const formSnapshot = await buildFormSnapshot(effectiveFormId)

          for (const newCat of input.newCats) {
            const catId = nanoid()
            const { photos, ...catData } = newCat

            await tx.insert(cats).values({
              id: catId,
              orgId,
              groupId: input.id,
              formId: effectiveFormId,
              formSnapshot,
              createdBy: userId,
              ...catData,
            })

            if (photos && photos.length > 0) {
              await tx.insert(catPhotos).values(
                photos.map((photo) => ({
                  id: nanoid(),
                  catId,
                  url: photo.url,
                  order: photo.order,
                }))
              )
            }
          }
        }

        if (input.photos) {
          const oldPhotos = await tx
            .select({ url: catGroupPhotos.url })
            .from(catGroupPhotos)
            .where(eq(catGroupPhotos.groupId, input.id))

          await tx
            .delete(catGroupPhotos)
            .where(eq(catGroupPhotos.groupId, input.id))

          if (input.photos.length > 0) {
            await tx.insert(catGroupPhotos).values(
              input.photos.map((photo) => ({
                id: nanoid(),
                groupId: input.id,
                url: photo.url,
                order: photo.order,
              }))
            )
          }

          const newUrls = new Set(input.photos.map((p) => p.url))
          const removedUrls = oldPhotos
            .map((p) => p.url)
            .filter((url) => !newUrls.has(url))
          if (removedUrls.length > 0) {
            const keys = removedUrls
              .map((url) => getKeyFromUrl(url))
              .filter((key): key is string => Boolean(key))
            Promise.all(keys.map((key) => deleteFile(key))).catch((err) =>
              console.error('Erro ao limpar fotos do grupo:', err)
            )
          }
        }
      })

      return { success: true }
    }),

  disband: protectedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const orgId = requireOrgId(ctx.session.user)

      const [group] = await db
        .select({ id: catGroups.id })
        .from(catGroups)
        .where(and(eq(catGroups.id, input.id), eq(catGroups.orgId, orgId)))

      if (!group) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Grupo não encontrado',
        })
      }

      const [pendingCount] = await db
        .select({ count: sql<number>`count(*)` })
        .from(applications)
        .where(
          and(
            eq(applications.groupId, input.id),
            sql`${applications.confirmedAt} is not null`,
            inArray(applications.status, ['pending', 'reviewing'])
          )
        )

      const groupPhotos = await db
        .select({ url: catGroupPhotos.url })
        .from(catGroupPhotos)
        .where(eq(catGroupPhotos.groupId, input.id))

      await db.transaction(async (tx) => {
        await tx
          .update(cats)
          .set({ groupId: null })
          .where(eq(cats.groupId, input.id))

        await tx.delete(catGroups).where(eq(catGroups.id, input.id))
      })

      if (groupPhotos.length > 0) {
        const keys = groupPhotos
          .map((p) => getKeyFromUrl(p.url))
          .filter((key): key is string => Boolean(key))
        Promise.all(keys.map((key) => deleteFile(key))).catch((err) =>
          console.error('Erro ao limpar fotos do grupo desmembrado:', err)
        )
      }

      return {
        success: true,
        hadPendingApplications: (pendingCount?.count ?? 0) > 0,
      }
    }),

  deleteGroup: protectedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const orgId = ctx.session.user.orgId
      if (!orgId) {
        throw new TRPCError({
          code: 'UNAUTHORIZED',
          message: 'Usuário não pertence a uma organização',
        })
      }

      const [group] = await db
        .select({ id: catGroups.id })
        .from(catGroups)
        .where(and(eq(catGroups.id, input.id), eq(catGroups.orgId, orgId)))

      if (!group) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Grupo não encontrado',
        })
      }

      const groupCats = await db
        .select({ id: cats.id, status: cats.status })
        .from(cats)
        .where(and(eq(cats.groupId, input.id), eq(cats.orgId, orgId)))

      if (groupCats.some((c) => c.status === 'adopted')) {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: 'Não é possível excluir um grupo com gatos já adotados',
        })
      }

      const groupPhotos = await db
        .select({ url: catGroupPhotos.url })
        .from(catGroupPhotos)
        .where(eq(catGroupPhotos.groupId, input.id))

      const catIds = groupCats.map((c) => c.id)
      const catPhotoRows =
        catIds.length > 0
          ? await db
              .select({ url: catPhotos.url })
              .from(catPhotos)
              .where(inArray(catPhotos.catId, catIds))
          : []

      const allUrls = [
        ...groupPhotos.map((p) => p.url),
        ...catPhotoRows.map((p) => p.url),
      ]
      const storageKeys = [
        ...new Set(
          allUrls
            .map((url) => getKeyFromUrl(url))
            .filter((key): key is string => Boolean(key))
        ),
      ]

      if (storageKeys.length > 0) {
        Promise.all(storageKeys.map((key) => deleteFile(key))).catch((err) =>
          console.error('Erro ao limpar arquivos do grupo excluído:', err)
        )
      }

      await db.transaction(async (tx) => {
        if (catIds.length > 0) {
          await tx.delete(cats).where(inArray(cats.id, catIds))
        }
        await tx.delete(catGroups).where(eq(catGroups.id, input.id))
      })

      return { success: true }
    }),

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

      // Find groups where ALL cats are available
      const allGroups = await db
        .select({
          id: catGroups.id,
          description: catGroups.description,
          createdAt: catGroups.createdAt,
        })
        .from(catGroups)
        .where(eq(catGroups.orgId, org.id))

      if (allGroups.length === 0) {
        return {
          groups: [],
          pagination: { page, limit, total: 0, totalPages: 0 },
        }
      }

      const groupIds = allGroups.map((g) => g.id)

      // Get all cats in these groups
      const groupCats = await db
        .select({
          id: cats.id,
          groupId: cats.groupId,
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
          status: cats.status,
          createdAt: cats.createdAt,
        })
        .from(cats)
        .where(inArray(cats.groupId, groupIds))
        .orderBy(asc(cats.createdAt))

      // Group cats by groupId
      const catsByGroup = new Map<
        string,
        Array<(typeof groupCats)[number]>
      >()
      for (const cat of groupCats) {
        if (!cat.groupId) continue
        const list = catsByGroup.get(cat.groupId) ?? []
        list.push(cat)
        catsByGroup.set(cat.groupId, list)
      }

      // Filter: only groups where ALL cats are available
      let eligibleGroupIds = allGroups
        .filter((g) => {
          const groupCatsList = catsByGroup.get(g.id)
          if (!groupCatsList || groupCatsList.length < 2) return false
          return groupCatsList.every((c) => c.status === 'available')
        })
        .map((g) => g.id)

      // Apply filters (inclusive: group matches if ANY cat matches)
      if (sex) {
        eligibleGroupIds = eligibleGroupIds.filter((gId) => {
          const cats = catsByGroup.get(gId) ?? []
          return cats.some((c) => c.sex === sex)
        })
      }

      if (ageRange) {
        eligibleGroupIds = eligibleGroupIds.filter((gId) => {
          const cats = catsByGroup.get(gId) ?? []
          return cats.some((c) => {
            const ageMonths =
              (c.ageYears ?? 0) * 12 + (c.ageMonths ?? 0)
            if (c.ageYears === null && c.ageMonths === null) return false
            if (ageRange === 'kitten') return ageMonths <= 11
            if (ageRange === 'young')
              return ageMonths >= 12 && ageMonths <= 47
            if (ageRange === 'adult')
              return ageMonths >= 48 && ageMonths <= 95
            if (ageRange === 'senior') return ageMonths >= 96
            return false
          })
        })
      }

      const total = eligibleGroupIds.length

      // Sort by group createdAt desc, then paginate
      const groupDataMap = new Map(
        allGroups.map((g) => [g.id, { createdAt: g.createdAt, description: g.description }])
      )
      const groupCreatedAtMap = new Map(
        allGroups.map((g) => [g.id, g.createdAt])
      )
      eligibleGroupIds.sort((a, b) => {
        const aDate = groupCreatedAtMap.get(a)?.getTime() ?? 0
        const bDate = groupCreatedAtMap.get(b)?.getTime() ?? 0
        return bDate - aDate
      })

      const paginatedGroupIds = eligibleGroupIds.slice(
        offset,
        offset + limit
      )

      // Get photos for cats in paginated groups
      const paginatedCatIds = paginatedGroupIds.flatMap(
        (gId) => (catsByGroup.get(gId) ?? []).map((c) => c.id)
      )

      const photos =
        paginatedCatIds.length > 0
          ? await db
              .select({
                id: catPhotos.id,
                catId: catPhotos.catId,
                url: catPhotos.url,
                order: catPhotos.order,
              })
              .from(catPhotos)
              .where(sql`${catPhotos.catId} IN ${paginatedCatIds}`)
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

      const groupPhotoRows =
        paginatedGroupIds.length > 0
          ? await db
              .select({
                groupId: catGroupPhotos.groupId,
                url: catGroupPhotos.url,
                order: catGroupPhotos.order,
              })
              .from(catGroupPhotos)
              .where(inArray(catGroupPhotos.groupId, paginatedGroupIds))
              .orderBy(catGroupPhotos.order)
          : []

      const groupPhotosByGroupId = groupPhotoRows.reduce<
        Record<string, Array<{ url: string; order: number }>>
      >((acc, photo) => {
        if (!acc[photo.groupId]) {
          acc[photo.groupId] = []
        }
        acc[photo.groupId]?.push({ url: photo.url, order: photo.order })
        return acc
      }, {})

      return {
        groups: paginatedGroupIds.map((gId) => {
          const groupCatsList = catsByGroup.get(gId) ?? []
          return {
            id: gId,
            description: groupDataMap.get(gId)?.description ?? null,
            createdAt: groupCreatedAtMap.get(gId) ?? new Date(),
            photos: groupPhotosByGroupId[gId] ?? [],
            cats: groupCatsList.map((cat) => ({
              id: cat.id,
              name: cat.name,
              ageYears: cat.ageYears,
              ageMonths: cat.ageMonths,
              sex: cat.sex,
              fiv: cat.fiv,
              felv: cat.felv,
              castrated: cat.castrated,
              vaccinated: cat.vaccinated,
              vaccinationNotes: cat.vaccinationNotes,
              dewormed: cat.dewormed,
              dewormingNotes: cat.dewormingNotes,
              description: cat.description,
              photos: photosByCatId[cat.id] ?? [],
            })),
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

  getFormForGroup: publicProcedure
    .input(
      z.object({
        slug: z.string().min(1),
        groupId: z.string().min(1),
      })
    )
    .query(async ({ input }) => {
      const { slug, groupId } = input

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

      const [group] = await db
        .select({
          id: catGroups.id,
          formId: catGroups.formId,
          formSnapshot: catGroups.formSnapshot,
        })
        .from(catGroups)
        .where(and(eq(catGroups.id, groupId), eq(catGroups.orgId, org.id)))

      if (!group) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Grupo não encontrado',
        })
      }

      // Verify all cats are available
      const groupCatsList = await db
        .select({
          id: cats.id,
          name: cats.name,
          sex: cats.sex,
          ageYears: cats.ageYears,
          ageMonths: cats.ageMonths,
          status: cats.status,
        })
        .from(cats)
        .where(eq(cats.groupId, groupId))
        .orderBy(asc(cats.createdAt))

      if (groupCatsList.some((c) => c.status !== 'available')) {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: 'Este grupo não está disponível para adoção',
        })
      }

      // Get photos for group cats
      const catIds = groupCatsList.map((c) => c.id)
      const photos =
        catIds.length > 0
          ? await db
              .select({
                catId: catPhotos.catId,
                url: catPhotos.url,
              })
              .from(catPhotos)
              .where(sql`${catPhotos.catId} IN ${catIds}`)
              .orderBy(catPhotos.catId, catPhotos.order)
          : []

      const firstPhotoByCatId = new Map<string, string>()
      for (const photo of photos) {
        if (!firstPhotoByCatId.has(photo.catId)) {
          firstPhotoByCatId.set(photo.catId, photo.url)
        }
      }

      // Get form fields
      let fields: CatFormFieldSnapshot[] = []
      if (group.formSnapshot && group.formSnapshot.length > 0) {
        fields = group.formSnapshot
      } else if (group.formId) {
        fields = await buildFormSnapshot(group.formId)
      }

      return {
        group: {
          id: group.id,
          cats: groupCatsList.map((cat) => ({
            id: cat.id,
            name: cat.name,
            sex: cat.sex,
            ageYears: cat.ageYears,
            ageMonths: cat.ageMonths,
            photoUrl: firstPhotoByCatId.get(cat.id) ?? null,
          })),
        },
        formId: group.formId,
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
})
