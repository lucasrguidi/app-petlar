import { relations, sql } from 'drizzle-orm'
import { index, integer, sqliteTable, text } from 'drizzle-orm/sqlite-core'

import { user } from './auth'
import { forms } from './forms'
import { orgs } from './orgs'

import type { CatFormFieldSnapshot } from './cats'

export const catGroups = sqliteTable(
  'cat_groups',
  {
    id: text('id').primaryKey(),
    orgId: text('org_id')
      .notNull()
      .references(() => orgs.id, { onDelete: 'cascade' }),
    formId: text('form_id')
      .notNull()
      .references(() => forms.id),
    formSnapshot: text('form_snapshot', { mode: 'json' }).$type<
      CatFormFieldSnapshot[] | null
    >(),

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
  (table) => [index('cat_groups_orgId_idx').on(table.orgId)]
)

export const catGroupPhotos = sqliteTable(
  'cat_group_photos',
  {
    id: text('id').primaryKey(),
    groupId: text('group_id')
      .notNull()
      .references(() => catGroups.id, { onDelete: 'cascade' }),
    url: text('url').notNull(),
    order: integer('order').notNull(),
    createdAt: integer('created_at', { mode: 'timestamp_ms' })
      .default(sql`(cast(unixepoch('subsecond') * 1000 as integer))`)
      .notNull(),
  },
  (table) => [index('catGroupPhotos_groupId_idx').on(table.groupId)]
)

export const catGroupPhotosRelations = relations(catGroupPhotos, ({ one }) => ({
  group: one(catGroups, {
    fields: [catGroupPhotos.groupId],
    references: [catGroups.id],
  }),
}))
