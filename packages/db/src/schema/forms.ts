import { relations, sql } from 'drizzle-orm'
import { index, integer, sqliteTable, text } from 'drizzle-orm/sqlite-core'

import { orgs } from './orgs'

export const formFieldTypes = [
  'text',
  'textarea',
  'boolean',
  'select',
  'media',
  'date',
] as const

export type FormFieldType = (typeof formFieldTypes)[number]

export interface FormFieldCondition {
  fieldId: string
  operator: 'equals'
  value: string | boolean
}

export interface FormFieldMediaConfig {
  kind: 'image' | 'video'
}

export const forms = sqliteTable(
  'forms',
  {
    id: text('id').primaryKey(),
    orgId: text('org_id')
      .notNull()
      .references(() => orgs.id, { onDelete: 'cascade' }),
    name: text('name').notNull(),
    description: text('description'),
    active: integer('active', { mode: 'boolean' }).notNull().default(true),
    createdAt: integer('created_at', { mode: 'timestamp_ms' })
      .default(sql`(cast(unixepoch('subsecond') * 1000 as integer))`)
      .notNull(),
    updatedAt: integer('updated_at', { mode: 'timestamp_ms' })
      .default(sql`(cast(unixepoch('subsecond') * 1000 as integer))`)
      .$onUpdate(() => new Date())
      .notNull(),
  },
  (table) => [index('forms_orgId_idx').on(table.orgId)]
)

export const formFields = sqliteTable(
  'form_fields',
  {
    id: text('id').primaryKey(),
    formId: text('form_id')
      .notNull()
      .references(() => forms.id, { onDelete: 'cascade' }),
    order: integer('order').notNull(),
    type: text('type', { enum: formFieldTypes }).notNull(),
    label: text('label').notNull(),
    required: integer('required', { mode: 'boolean' }).notNull().default(false),
    helpText: text('help_text'),
    options: text('options', { mode: 'json' }).$type<string[] | null>(),
    condition: text('condition', {
      mode: 'json',
    }).$type<FormFieldCondition | null>(),
    mediaConfig: text('media_config', {
      mode: 'json',
    }).$type<FormFieldMediaConfig | null>(),
    createdAt: integer('created_at', { mode: 'timestamp_ms' })
      .default(sql`(cast(unixepoch('subsecond') * 1000 as integer))`)
      .notNull(),
    updatedAt: integer('updated_at', { mode: 'timestamp_ms' })
      .default(sql`(cast(unixepoch('subsecond') * 1000 as integer))`)
      .$onUpdate(() => new Date())
      .notNull(),
  },
  (table) => [
    index('formFields_formId_idx').on(table.formId),
    index('formFields_formId_order_idx').on(table.formId, table.order),
  ]
)

export const formsRelations = relations(forms, ({ one, many }) => ({
  org: one(orgs, { fields: [forms.orgId], references: [orgs.id] }),
  fields: many(formFields),
}))

export const formFieldsRelations = relations(formFields, ({ one }) => ({
  form: one(forms, { fields: [formFields.formId], references: [forms.id] }),
}))
