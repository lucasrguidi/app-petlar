import { relations, sql } from 'drizzle-orm'
import { index, integer, sqliteTable, text } from 'drizzle-orm/sqlite-core'

import { orgs } from './orgs'

export const sponsors = sqliteTable(
  'sponsors',
  {
    id: text('id').primaryKey(),
    orgId: text('org_id')
      .notNull()
      .references(() => orgs.id, { onDelete: 'cascade' }),
    name: text('name').notNull(),
    logoUrl: text('logo_url').notNull(),
    websiteUrl: text('website_url').notNull(),
    featured: integer('featured', { mode: 'boolean' }).notNull().default(false),
    order: integer('order').notNull(),
    createdAt: integer('created_at', { mode: 'timestamp_ms' })
      .default(sql`(cast(unixepoch('subsecond') * 1000 as integer))`)
      .notNull(),
    updatedAt: integer('updated_at', { mode: 'timestamp_ms' })
      .default(sql`(cast(unixepoch('subsecond') * 1000 as integer))`)
      .$onUpdate(() => new Date())
      .notNull(),
  },
  (table) => [
    index('sponsors_orgId_idx').on(table.orgId),
    index('sponsors_orgId_order_idx').on(table.orgId, table.order),
  ]
)

export const sponsorsRelations = relations(sponsors, ({ one }) => ({
  org: one(orgs, { fields: [sponsors.orgId], references: [orgs.id] }),
}))
