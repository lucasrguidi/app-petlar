import { relations, sql } from 'drizzle-orm'
import { index, integer, sqliteTable, text } from 'drizzle-orm/sqlite-core'

import { user } from './auth'
import { orgs } from './orgs'

export const cats = sqliteTable(
  'cats',
  {
    id: text('id').primaryKey(),
    orgId: text('org_id')
      .notNull()
      .references(() => orgs.id, { onDelete: 'cascade' }),
    formId: text('form_id'), // FK para forms (será criada depois)

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
  createdByUser: one(user, { fields: [cats.createdBy], references: [user.id] }),
  photos: many(catPhotos),
}))

export const catPhotosRelations = relations(catPhotos, ({ one }) => ({
  cat: one(cats, { fields: [catPhotos.catId], references: [cats.id] }),
}))
