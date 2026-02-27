import { sql } from 'drizzle-orm'
import {
  sqliteTable,
  text,
  integer,
  uniqueIndex,
} from 'drizzle-orm/sqlite-core'

export const orgs = sqliteTable(
  'orgs',
  {
    id: text('id').primaryKey(),
    name: text('name').notNull(),
    slug: text('slug').notNull(),
    logoUrl: text('logo_url'),

    // Custom domain (nullable) - e.g., "queroadotar.com.br"
    customDomain: text('custom_domain'),

    // Theme colors (nullable, fallback to defaults in code)
    primaryColor: text('primary_color'),
    primaryForegroundColor: text('primary_foreground_color'),
    secondaryColor: text('secondary_color'),
    secondaryForegroundColor: text('secondary_foreground_color'),
    backgroundColor: text('background_color'),
    foregroundColor: text('foreground_color'),
    accentColor: text('accent_color'),
    mutedColor: text('muted_color'),
    mutedForegroundColor: text('muted_foreground_color'),

    createdAt: integer('created_at', { mode: 'timestamp_ms' })
      .default(sql`(cast(unixepoch('subsecond') * 1000 as integer))`)
      .notNull(),
    updatedAt: integer('updated_at', { mode: 'timestamp_ms' })
      .default(sql`(cast(unixepoch('subsecond') * 1000 as integer))`)
      .$onUpdate(() => new Date())
      .notNull(),
  },
  (table) => [
    uniqueIndex('orgs_slug_idx').on(table.slug),
    uniqueIndex('orgs_custom_domain_idx').on(table.customDomain),
  ]
)
