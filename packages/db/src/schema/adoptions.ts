import { relations, sql } from 'drizzle-orm'
import {
  index,
  integer,
  sqliteTable,
  text,
  unique,
} from 'drizzle-orm/sqlite-core'

import { applications } from './applications'
import { user } from './auth'
import { catGroups } from './cat-groups'
import { cats } from './cats'
import { orgs } from './orgs'

export const adoptions = sqliteTable(
  'adoptions',
  {
    id: text('id').primaryKey(),
    orgId: text('org_id')
      .notNull()
      .references(() => orgs.id, { onDelete: 'cascade' }),
    catId: text('cat_id')
      .notNull()
      .references(() => cats.id, { onDelete: 'cascade' }),
    groupId: text('group_id').references(() => catGroups.id, {
      onDelete: 'set null',
    }),
    applicationId: text('application_id').references(() => applications.id, {
      onDelete: 'set null',
    }),

    // Adopter data
    adopterName: text('adopter_name').notNull(),
    adopterNameNormalized: text('adopter_name_normalized')
      .notNull()
      .default(''),
    adopterPhone: text('adopter_phone').notNull(),
    adopterEmail: text('adopter_email'),

    // Adoption details
    adoptionDate: text('adoption_date').notNull(), // YYYY-MM-DD
    adoptionTermUrl: text('adoption_term_url'),
    notes: text('notes'),

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
    index('adoptions_orgId_idx').on(table.orgId),
    unique('adoptions_catId_unique').on(table.catId),
    index('adoptions_adoptionDate_idx').on(table.adoptionDate),
    index('adoptions_orgId_adoptionDate_idx').on(
      table.orgId,
      table.adoptionDate
    ),
    index('adoptions_orgId_adopterNameNormalized_idx').on(
      table.orgId,
      table.adopterNameNormalized
    ),
    index('adoptions_groupId_idx').on(table.groupId),
  ]
)

export const adoptionsRelations = relations(adoptions, ({ one }) => ({
  org: one(orgs, { fields: [adoptions.orgId], references: [orgs.id] }),
  cat: one(cats, { fields: [adoptions.catId], references: [cats.id] }),
  group: one(catGroups, {
    fields: [adoptions.groupId],
    references: [catGroups.id],
  }),
  application: one(applications, {
    fields: [adoptions.applicationId],
    references: [applications.id],
  }),
  createdByUser: one(user, {
    fields: [adoptions.createdBy],
    references: [user.id],
  }),
}))
