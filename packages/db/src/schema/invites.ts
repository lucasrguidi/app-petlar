import { relations, sql } from 'drizzle-orm'
import { index, integer, sqliteTable, text } from 'drizzle-orm/sqlite-core'

import { user } from './auth'
import { orgs } from './orgs'

export const inviteRoles = ['admin', 'volunteer'] as const
export type InviteRole = (typeof inviteRoles)[number]

export const invites = sqliteTable(
  'invites',
  {
    id: text('id').primaryKey(),
    orgId: text('org_id')
      .notNull()
      .references(() => orgs.id, { onDelete: 'cascade' }),
    email: text('email').notNull(),
    role: text('role', { enum: inviteRoles }).default('volunteer').notNull(),
    token: text('token').notNull().unique(),
    expiresAt: integer('expires_at', { mode: 'timestamp_ms' }).notNull(),
    usedAt: integer('used_at', { mode: 'timestamp_ms' }),
    invitedById: text('invited_by_id')
      .notNull()
      .references(() => user.id, { onDelete: 'cascade' }),
    createdAt: integer('created_at', { mode: 'timestamp_ms' })
      .default(sql`(cast(unixepoch('subsecond') * 1000 as integer))`)
      .notNull(),
  },
  (table) => [
    index('invites_org_id_idx').on(table.orgId),
    index('invites_email_idx').on(table.email),
    index('invites_token_idx').on(table.token),
  ]
)

export const inviteRelations = relations(invites, ({ one }) => ({
  org: one(orgs, { fields: [invites.orgId], references: [orgs.id] }),
  invitedBy: one(user, { fields: [invites.invitedById], references: [user.id] }),
}))
