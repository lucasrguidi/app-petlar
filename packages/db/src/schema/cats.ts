import { relations, sql } from 'drizzle-orm'
import { index, integer, sqliteTable, text } from 'drizzle-orm/sqlite-core'

import { user } from './auth'
import { catGroupPhotos, catGroups } from './cat-groups'
import { forms } from './forms'
import { orgs } from './orgs'

import type {
  FormFieldCondition,
  FormFieldMediaConfig,
  FormFieldType,
} from './forms'

export interface CatFormFieldSnapshot {
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

export const cats = sqliteTable(
  'cats',
  {
    id: text('id').primaryKey(),
    orgId: text('org_id')
      .notNull()
      .references(() => orgs.id, { onDelete: 'cascade' }),
    groupId: text('group_id').references(() => catGroups.id, {
      onDelete: 'set null',
    }),
    formId: text('form_id')
      .notNull()
      .references(() => forms.id),
    // Snapshot do formulário no momento da criação do gato.
    // Templates podem evoluir, mas o gato mantém estrutura fixa para candidaturas.
    formSnapshot: text('form_snapshot', { mode: 'json' }).$type<
      CatFormFieldSnapshot[] | null
    >(),

    // Dados básicos
    name: text('name').notNull(),
    ageYears: integer('age_years'),
    ageMonths: integer('age_months'),
    sex: text('sex', { enum: ['male', 'female'] }).notNull(),

    // Saúde
    fiv: text('fiv', {
      enum: ['positive', 'negative', 'not_tested'],
    }).notNull(),
    felv: text('felv', {
      enum: ['positive', 'negative', 'not_tested'],
    }).notNull(),
    castrated: integer('castrated', { mode: 'boolean' })
      .notNull()
      .default(false),
    vaccinated: integer('vaccinated', { mode: 'boolean' })
      .notNull()
      .default(false),
    vaccinationNotes: text('vaccination_notes'),
    dewormed: integer('dewormed', { mode: 'boolean' }).notNull().default(false),
    dewormingNotes: text('deworming_notes'),

    // Descrição
    description: text('description'),

    // Doador
    donorName: text('donor_name'),
    donorWhatsapp: text('donor_whatsapp'),

    // Status
    status: text('status', { enum: ['available', 'in_progress', 'adopted'] })
      .notNull()
      .default('available'),

    // Audit
    createdBy: text('created_by')
      .notNull()
      .references(() => user.id),
    createdAt: integer('created_at', { mode: 'timestamp_ms' })
      .default(sql`(cast(unixepoch('subsecond') * 1000 as integer))`)
      .notNull(),
    updatedAt: integer('updated_at', { mode: 'timestamp_ms' })
      .default(sql`(cast(unixepoch('subsecond') * 1000 as integer))`)
      .$onUpdate(() => new Date())
      .notNull(),
  },
  (table) => [
    index('cats_orgId_idx').on(table.orgId),
    index('cats_status_idx').on(table.status),
    index('cats_groupId_idx').on(table.groupId),
  ]
)

export const catPhotos = sqliteTable(
  'cat_photos',
  {
    id: text('id').primaryKey(),
    catId: text('cat_id')
      .notNull()
      .references(() => cats.id, { onDelete: 'cascade' }),
    url: text('url').notNull(),
    order: integer('order').notNull(),
    createdAt: integer('created_at', { mode: 'timestamp_ms' })
      .default(sql`(cast(unixepoch('subsecond') * 1000 as integer))`)
      .notNull(),
  },
  (table) => [index('catPhotos_catId_idx').on(table.catId)]
)

export const catsRelations = relations(cats, ({ one, many }) => ({
  org: one(orgs, { fields: [cats.orgId], references: [orgs.id] }),
  group: one(catGroups, { fields: [cats.groupId], references: [catGroups.id] }),
  form: one(forms, { fields: [cats.formId], references: [forms.id] }),
  createdByUser: one(user, { fields: [cats.createdBy], references: [user.id] }),
  photos: many(catPhotos),
}))

export const catGroupsRelations = relations(catGroups, ({ one, many }) => ({
  org: one(orgs, { fields: [catGroups.orgId], references: [orgs.id] }),
  form: one(forms, { fields: [catGroups.formId], references: [forms.id] }),
  createdByUser: one(user, {
    fields: [catGroups.createdBy],
    references: [user.id],
  }),
  cats: many(cats),
  photos: many(catGroupPhotos),
}))

export const catPhotosRelations = relations(catPhotos, ({ one }) => ({
  cat: one(cats, { fields: [catPhotos.catId], references: [cats.id] }),
}))
