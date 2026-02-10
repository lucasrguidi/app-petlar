import { db } from '@app-petlar/db'
import { catPhotos, cats } from '@app-petlar/db/schema'
import { TRPCError } from '@trpc/server'
import { and, desc, eq, like, sql } from 'drizzle-orm'
import { nanoid } from 'nanoid'
import { z } from 'zod'

import { protectedProcedure, router } from '../index'

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
  description: z.string().min(1),
  formId: z.string().nullable(),
})

// Schema para fotos
const photoSchema = z.object({
  url: z.string().url(),
  order: z.number().int().min(1).max(3),
})

// Schema de filtros para listagem
const listFiltersSchema = z.object({
  status: z.enum(['available', 'in_progress', 'adopted']).optional(),
  sex: z.enum(['male', 'female']).optional(),
  fiv: z.enum(['positive', 'negative', 'not_tested']).optional(),
  felv: z.enum(['positive', 'negative', 'not_tested']).optional(),
  castrated: z.boolean().optional(),
  search: z.string().optional(),
  page: z.number().int().min(1).default(1),
  limit: z.number().int().min(1).max(50).default(10),
  includeAdopted: z.boolean().default(false),
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

export const catsRouter = router({
  /**
   * Lista gatos com filtros e paginação
   */
  list: protectedProcedure
    .input(listFiltersSchema)
    .query(async ({ ctx, input }) => {
      const {
        status,
        sex,
        fiv,
        felv,
        castrated,
        search,
        page,
        limit,
        includeAdopted,
      } = input
      const orgId = requireOrgId(ctx.session.user)
      const offset = (page - 1) * limit

      // Construir condições de filtro
      const conditions = [eq(cats.orgId, orgId)]

      if (status) {
        conditions.push(eq(cats.status, status))
      } else if (!includeAdopted) {
        // Exclude adopted cats by default unless explicitly requested
        conditions.push(sql`${cats.status} != 'adopted'`)
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
          status: cats.status,
          createdAt: cats.createdAt,
        })
        .from(cats)
        .where(and(...conditions))
        .orderBy(desc(cats.createdAt))
        .limit(limit)
        .offset(offset)

      // Buscar fotos principais (order=1) para cada gato
      const catIds = catsList.map((c) => c.id)
      const photos =
        catIds.length > 0
          ? await db
              .select({
                catId: catPhotos.catId,
                url: catPhotos.url,
              })
              .from(catPhotos)
              .where(
                and(
                  eq(catPhotos.order, 1),
                  sql`${catPhotos.catId} IN ${catIds}`
                )
              )
          : []

      // Mapear fotos para gatos
      const photosMap = new Map(photos.map((p) => [p.catId, p.url]))

      // Contar total para paginação
      const [countResult] = await db
        .select({ count: sql<number>`count(*)` })
        .from(cats)
        .where(and(...conditions))

      const total = countResult?.count ?? 0

      return {
        cats: catsList.map((cat) => ({
          ...cat,
          photoUrl: photosMap.get(cat.id) ?? null,
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
   * Busca gato por ID com todas as fotos
   */
  getById: protectedProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ ctx, input }) => {
      const orgId = requireOrgId(ctx.session.user)

      const [cat] = await db
        .select()
        .from(cats)
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

      await db.transaction(async (tx) => {
        // Inserir gato
        await tx.insert(cats).values({
          id: catId,
          orgId,
          createdBy: ctx.session.user.id,
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
        .select({ id: cats.id })
        .from(cats)
        .where(and(eq(cats.id, input.id), eq(cats.orgId, orgId)))

      if (!existingCat) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Gato não encontrado',
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

      // Verificar se gato existe e pertence à org
      const [existingCat] = await db
        .select({ id: cats.id })
        .from(cats)
        .where(and(eq(cats.id, input.id), eq(cats.orgId, orgId)))

      if (!existingCat) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Gato não encontrado',
        })
      }

      await db.delete(cats).where(eq(cats.id, input.id))

      return { success: true }
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

      const newCatId = nanoid()

      // Criar cópia com novo ID e nome modificado
      await db.insert(cats).values({
        id: newCatId,
        orgId,
        formId: originalCat.formId,
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
        status: z.enum(['available', 'in_progress', 'adopted']),
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
        available: ['in_progress', 'adopted'],
        in_progress: ['available', 'adopted'],
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
