import { db } from '@app-petlar/db'
import {
  applications,
  catGroups,
  cats,
  formFields,
  forms,
  formFieldTypes,
  type CatFormFieldSnapshot,
  type FormFieldCondition,
  type FormFieldMediaConfig,
  type FormFieldType,
} from '@app-petlar/db/schema'
import { TRPCError } from '@trpc/server'
import { and, asc, desc, eq, sql } from 'drizzle-orm'
import { nanoid } from 'nanoid'
import { z } from 'zod'

import { adminProcedure, protectedProcedure, router } from '../index'

const MAX_FIELDS_PER_FORM = 30
const MAX_SELECT_OPTIONS = 20

const fieldTypeSchema = z.enum(formFieldTypes)

const conditionSchema = z
  .object({
    fieldId: z.string().min(1),
    operator: z.literal('equals'),
    value: z.union([z.string().min(1), z.boolean()]),
  })
  .nullable()
  .optional()

const mediaConfigSchema = z
  .object({
    kind: z.enum(['image', 'video']),
  })
  .nullable()
  .optional()

const formFieldInputSchema = z.object({
  id: z.string().min(1).optional(),
  type: fieldTypeSchema,
  label: z.string().trim().min(1).max(140),
  required: z.boolean().default(false),
  helpText: z.string().trim().max(240).nullable().optional(),
  options: z.array(z.string().trim().min(1).max(80)).nullable().optional(),
  condition: conditionSchema,
  mediaConfig: mediaConfigSchema,
  order: z.number().int().min(1).optional(),
})

const formBaseInputSchema = z.object({
  name: z.string().trim().min(1).max(120),
  description: z.string().trim().max(240).nullable().optional(),
  active: z.boolean().optional(),
})

type SessionUser = {
  id: string
  orgId?: string | null
  role?: string | null
}

type FieldInput = z.infer<typeof formFieldInputSchema>

type NormalizedField = {
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

function requireOrgId(user: SessionUser): string {
  if (!user.orgId) {
    throw new TRPCError({
      code: 'FORBIDDEN',
      message: 'Usuário não pertence a nenhuma organização',
    })
  }
  return user.orgId
}

function normalizeTextValue(value: string | null | undefined): string | null {
  if (!value) return null
  const normalized = value.trim()
  return normalized.length > 0 ? normalized : null
}

function normalizeSelectOptions(
  options: string[] | null | undefined
): string[] {
  if (!options || options.length === 0) return []
  const unique = new Set<string>()
  for (const option of options) {
    const normalized = option.trim()
    if (normalized.length > 0) {
      unique.add(normalized)
    }
  }
  return Array.from(unique).slice(0, MAX_SELECT_OPTIONS)
}

function normalizeField(
  field: FieldInput,
  fallbackOrder: number
): NormalizedField {
  const type = field.type
  const options =
    type === 'select' ? normalizeSelectOptions(field.options) : null

  if (type === 'select' && (!options || options.length === 0)) {
    throw new TRPCError({
      code: 'BAD_REQUEST',
      message: `A pergunta "${field.label}" precisa de opções de resposta`,
    })
  }

  return {
    id: field.id ?? nanoid(),
    type,
    label: field.label.trim(),
    required: field.required,
    helpText: normalizeTextValue(field.helpText),
    options,
    condition: field.condition ?? null,
    mediaConfig:
      type === 'media' ? (field.mediaConfig ?? { kind: 'image' }) : null,
    order: field.order ?? fallbackOrder,
  }
}

function validateConditionFieldType(
  parentField: NormalizedField,
  childField: NormalizedField
): void {
  if (!childField.condition) return

  if (parentField.type === 'media') {
    throw new TRPCError({
      code: 'BAD_REQUEST',
      message: `A pergunta "${childField.label}" não pode depender de um campo de upload`,
    })
  }

  if (parentField.type === 'select') {
    if (typeof childField.condition.value !== 'string') {
      throw new TRPCError({
        code: 'BAD_REQUEST',
        message: `A condição de "${childField.label}" precisa usar um valor de texto`,
      })
    }

    const options = parentField.options ?? []
    if (!options.includes(childField.condition.value)) {
      throw new TRPCError({
        code: 'BAD_REQUEST',
        message: `Valor da condição inválido para "${childField.label}"`,
      })
    }
  }

  if (parentField.type === 'boolean') {
    if (typeof childField.condition.value !== 'boolean') {
      throw new TRPCError({
        code: 'BAD_REQUEST',
        message: `A condição de "${childField.label}" precisa ser Sim ou Não`,
      })
    }
  }

  if (parentField.type !== 'select' && parentField.type !== 'boolean') {
    if (typeof childField.condition.value !== 'string') {
      throw new TRPCError({
        code: 'BAD_REQUEST',
        message: `A condição de "${childField.label}" precisa usar um valor de texto`,
      })
    }
  }
}

function normalizeAndValidateFields(fields: FieldInput[]): NormalizedField[] {
  if (fields.length > MAX_FIELDS_PER_FORM) {
    throw new TRPCError({
      code: 'BAD_REQUEST',
      message: `Um formulário pode ter no máximo ${MAX_FIELDS_PER_FORM} perguntas`,
    })
  }

  const normalized = fields
    .map((field, index) => normalizeField(field, index + 1))
    .sort((a, b) => a.order - b.order)
    .map((field, index) => ({
      ...field,
      order: index + 1,
    }))

  const idSet = new Set<string>()
  for (const field of normalized) {
    if (idSet.has(field.id)) {
      throw new TRPCError({
        code: 'BAD_REQUEST',
        message: 'Perguntas duplicadas encontradas no formulário',
      })
    }
    idSet.add(field.id)
  }

  normalized.forEach((field, index) => {
    if (!field.condition) return

    if (!idSet.has(field.condition.fieldId)) {
      throw new TRPCError({
        code: 'BAD_REQUEST',
        message: `A condição da pergunta "${field.label}" aponta para uma pergunta inexistente`,
      })
    }

    const parentIndex = normalized.findIndex(
      (f) => f.id === field.condition?.fieldId
    )
    if (parentIndex === -1 || parentIndex >= index) {
      throw new TRPCError({
        code: 'BAD_REQUEST',
        message: `A condição da pergunta "${field.label}" só pode usar perguntas anteriores`,
      })
    }

    const parentField = normalized[parentIndex]
    if (!parentField) {
      throw new TRPCError({
        code: 'BAD_REQUEST',
        message: `A condição da pergunta "${field.label}" está inválida`,
      })
    }

    validateConditionFieldType(parentField, field)
  })

  return normalized
}

function buildFormSnapshot(
  normalizedFields: NormalizedField[]
): CatFormFieldSnapshot[] {
  return normalizedFields.map((field) => ({
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

async function syncFormSnapshots(formId: string): Promise<void> {
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

  const snapshot = buildFormSnapshot(
    fields.map((f) => ({ ...f, condition: f.condition ?? null, mediaConfig: f.mediaConfig ?? null }))
  )

  await Promise.all([
    db
      .update(cats)
      .set({ formSnapshot: snapshot })
      .where(
        and(
          eq(cats.formId, formId),
          sql`NOT EXISTS (SELECT 1 FROM ${applications} WHERE ${applications.catId} = ${cats.id})`
        )
      ),
    db
      .update(catGroups)
      .set({ formSnapshot: snapshot })
      .where(
        and(
          eq(catGroups.formId, formId),
          sql`NOT EXISTS (SELECT 1 FROM ${applications} WHERE ${applications.groupId} = ${catGroups.id})`
        )
      ),
  ])
}

export const formsRouter = router({
  options: protectedProcedure.query(async ({ ctx }) => {
    const orgId = requireOrgId(ctx.session.user)

    return db
      .select({
        id: forms.id,
        name: forms.name,
        active: forms.active,
        updatedAt: forms.updatedAt,
      })
      .from(forms)
      .where(eq(forms.orgId, orgId))
      .orderBy(desc(forms.updatedAt))
  }),

  list: adminProcedure.query(async ({ ctx }) => {
    const orgId = requireOrgId(ctx.session.user)

    const [formsList, fieldsCountRows, linkedCatsRows] = await Promise.all([
      db
        .select({
          id: forms.id,
          name: forms.name,
          description: forms.description,
          active: forms.active,
          createdAt: forms.createdAt,
          updatedAt: forms.updatedAt,
        })
        .from(forms)
        .where(eq(forms.orgId, orgId))
        .orderBy(desc(forms.updatedAt)),
      db
        .select({
          formId: formFields.formId,
          count: sql<number>`count(*)`,
        })
        .from(formFields)
        .groupBy(formFields.formId),
      db
        .select({
          formId: cats.formId,
          count: sql<number>`count(*)`,
        })
        .from(cats)
        .where(and(eq(cats.orgId, orgId), sql`${cats.formId} is not null`))
        .groupBy(cats.formId),
    ])

    const fieldsCountMap = new Map(
      fieldsCountRows.map((row) => [row.formId, row.count])
    )
    const linkedCatsMap = new Map(
      linkedCatsRows
        .filter((row): row is { formId: string; count: number } =>
          Boolean(row.formId)
        )
        .map((row) => [row.formId, row.count])
    )

    return formsList.map((form) => ({
      ...form,
      fieldsCount: fieldsCountMap.get(form.id) ?? 0,
      linkedCatsCount: linkedCatsMap.get(form.id) ?? 0,
    }))
  }),

  getById: adminProcedure
    .input(z.object({ id: z.string().min(1) }))
    .query(async ({ ctx, input }) => {
      const orgId = requireOrgId(ctx.session.user)

      const [form] = await db
        .select({
          id: forms.id,
          name: forms.name,
          description: forms.description,
          active: forms.active,
          createdAt: forms.createdAt,
          updatedAt: forms.updatedAt,
        })
        .from(forms)
        .where(and(eq(forms.id, input.id), eq(forms.orgId, orgId)))

      if (!form) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Formulário não encontrado',
        })
      }

      const fields = await db
        .select({
          id: formFields.id,
          formId: formFields.formId,
          order: formFields.order,
          type: formFields.type,
          label: formFields.label,
          required: formFields.required,
          helpText: formFields.helpText,
          options: formFields.options,
          condition: formFields.condition,
          mediaConfig: formFields.mediaConfig,
          createdAt: formFields.createdAt,
          updatedAt: formFields.updatedAt,
        })
        .from(formFields)
        .where(eq(formFields.formId, form.id))
        .orderBy(asc(formFields.order))

      const [linkedCats] = await db
        .select({ count: sql<number>`count(*)` })
        .from(cats)
        .where(and(eq(cats.orgId, orgId), eq(cats.formId, form.id)))

      return {
        ...form,
        linkedCatsCount: linkedCats?.count ?? 0,
        fields: fields.map((field) => ({
          id: field.id,
          type: field.type,
          label: field.label,
          required: field.required,
          helpText: field.helpText,
          options: field.options,
          condition: field.condition,
          mediaConfig: field.mediaConfig,
          order: field.order,
        })),
      }
    }),

  create: adminProcedure
    .input(
      z.object({
        form: formBaseInputSchema,
        fields: z
          .array(formFieldInputSchema)
          .max(MAX_FIELDS_PER_FORM)
          .default([]),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const orgId = requireOrgId(ctx.session.user)

      const formId = nanoid()
      const normalizedFields = normalizeAndValidateFields(input.fields)

      await db.transaction(async (tx) => {
        await tx.insert(forms).values({
          id: formId,
          orgId,
          name: input.form.name,
          description: normalizeTextValue(input.form.description),
          active: input.form.active ?? true,
        })

        if (normalizedFields.length > 0) {
          await tx.insert(formFields).values(
            normalizedFields.map((field) => ({
              id: field.id,
              formId,
              order: field.order,
              type: field.type,
              label: field.label,
              required: field.required,
              helpText: field.helpText,
              options: field.options,
              condition: field.condition,
              mediaConfig: field.mediaConfig,
            }))
          )
        }
      })

      return { id: formId }
    }),

  update: adminProcedure
    .input(
      z.object({
        id: z.string().min(1),
        form: formBaseInputSchema.partial(),
        fields: z
          .array(formFieldInputSchema)
          .max(MAX_FIELDS_PER_FORM)
          .optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const orgId = requireOrgId(ctx.session.user)

      const [existingForm] = await db
        .select({ id: forms.id })
        .from(forms)
        .where(and(eq(forms.id, input.id), eq(forms.orgId, orgId)))

      if (!existingForm) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Formulário não encontrado',
        })
      }

      const formPayload: Partial<typeof forms.$inferInsert> = {}
      if (input.form.name !== undefined) {
        formPayload.name = input.form.name
      }
      if (input.form.description !== undefined) {
        formPayload.description = normalizeTextValue(input.form.description)
      }
      if (input.form.active !== undefined) {
        formPayload.active = input.form.active
      }

      const normalizedFields =
        input.fields !== undefined
          ? normalizeAndValidateFields(input.fields)
          : null

      await db.transaction(async (tx) => {
        if (Object.keys(formPayload).length > 0) {
          await tx.update(forms).set(formPayload).where(eq(forms.id, input.id))
        }

        if (normalizedFields !== null) {
          await tx.delete(formFields).where(eq(formFields.formId, input.id))

          if (normalizedFields.length > 0) {
            await tx.insert(formFields).values(
              normalizedFields.map((field) => ({
                id: field.id,
                formId: input.id,
                order: field.order,
                type: field.type,
                label: field.label,
                required: field.required,
                helpText: field.helpText,
                options: field.options,
                condition: field.condition,
                mediaConfig: field.mediaConfig,
              }))
            )
          }
        }
      })

      if (normalizedFields !== null) {
        await syncFormSnapshots(input.id)
      }

      return { success: true }
    }),

  delete: adminProcedure
    .input(z.object({ id: z.string().min(1) }))
    .mutation(async ({ ctx, input }) => {
      const orgId = requireOrgId(ctx.session.user)

      const [existingForm] = await db
        .select({ id: forms.id })
        .from(forms)
        .where(and(eq(forms.id, input.id), eq(forms.orgId, orgId)))

      if (!existingForm) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Formulário não encontrado',
        })
      }

      const [linkedCats] = await db
        .select({ count: sql<number>`count(*)` })
        .from(cats)
        .where(and(eq(cats.orgId, orgId), eq(cats.formId, input.id)))

      if ((linkedCats?.count ?? 0) > 0) {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message:
            'Este formulário está vinculado a gatos e não pode ser excluído',
        })
      }

      await db.delete(forms).where(eq(forms.id, input.id))
      return { success: true }
    }),

  duplicate: adminProcedure
    .input(z.object({ id: z.string().min(1) }))
    .mutation(async ({ ctx, input }) => {
      const orgId = requireOrgId(ctx.session.user)

      const [original] = await db
        .select({
          id: forms.id,
          name: forms.name,
          description: forms.description,
          active: forms.active,
        })
        .from(forms)
        .where(and(eq(forms.id, input.id), eq(forms.orgId, orgId)))

      if (!original) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Formulário não encontrado',
        })
      }

      const originalFields = await db
        .select()
        .from(formFields)
        .where(eq(formFields.formId, original.id))
        .orderBy(asc(formFields.order))

      const duplicatedFormId = nanoid()
      const fieldIdMap = new Map<string, string>()
      originalFields.forEach((field) => {
        fieldIdMap.set(field.id, nanoid())
      })

      await db.transaction(async (tx) => {
        await tx.insert(forms).values({
          id: duplicatedFormId,
          orgId,
          name: `${original.name} (cópia)`,
          description: original.description,
          active: original.active,
        })

        if (originalFields.length > 0) {
          await tx.insert(formFields).values(
            originalFields.map((field) => {
              const newId = fieldIdMap.get(field.id)!
              const condition = field.condition
                ? {
                    ...field.condition,
                    fieldId: fieldIdMap.get(field.condition.fieldId) ?? '',
                  }
                : null

              return {
                id: newId,
                formId: duplicatedFormId,
                order: field.order,
                type: field.type,
                label: field.label,
                required: field.required,
                helpText: field.helpText,
                options: field.options,
                condition: condition?.fieldId ? condition : null,
                mediaConfig: field.mediaConfig,
              }
            })
          )
        }
      })

      return { id: duplicatedFormId }
    }),

})
