import { relations, sql } from 'drizzle-orm'
import { index, integer, sqliteTable, text } from 'drizzle-orm/sqlite-core'

import { cats } from './cats'
import { forms } from './forms'
import { orgs } from './orgs'

export const applicationStatuses = [
  'pending',
  'reviewing',
  'approved',
  'rejected',
] as const

export type ApplicationStatus = (typeof applicationStatuses)[number]

export const applicationFileTypes = ['image', 'video'] as const

export type ApplicationFileType = (typeof applicationFileTypes)[number]

// JSON type for dynamic form responses
export interface ApplicationResponses {
  [fieldId: string]: string | boolean | null
}

export const applications = sqliteTable(
  'applications',
  {
    id: text('id').primaryKey(),
    orgId: text('org_id')
      .notNull()
      .references(() => orgs.id, { onDelete: 'cascade' }),
    catId: text('cat_id')
      .notNull()
      .references(() => cats.id, { onDelete: 'cascade' }),
    formId: text('form_id').references(() => forms.id, { onDelete: 'set null' }), // Snapshot - form may be deleted later

    // Status
    status: text('status', { enum: applicationStatuses })
      .notNull()
      .default('pending'),

    // Applicant fixed data
    applicantName: text('applicant_name').notNull(),
    applicantEmail: text('applicant_email').notNull(),
    applicantWhatsapp: text('applicant_whatsapp').notNull(),

    // Dynamic form responses (JSON)
    responses: text('responses', { mode: 'json' }).$type<ApplicationResponses>(),

    // Consents (LGPD)
    lgpdConsent: integer('lgpd_consent', { mode: 'boolean' }).notNull(),
    whatsappConsent: integer('whatsapp_consent', { mode: 'boolean' }).notNull(),

    // Email confirmation (for phase 4.5)
    confirmationToken: text('confirmation_token').unique(),
    confirmedAt: integer('confirmed_at', { mode: 'timestamp_ms' }),

    // Timestamps
    createdAt: integer('created_at', { mode: 'timestamp_ms' })
      .default(sql`(cast(unixepoch('subsecond') * 1000 as integer))`)
      .notNull(),
    updatedAt: integer('updated_at', { mode: 'timestamp_ms' })
      .default(sql`(cast(unixepoch('subsecond') * 1000 as integer))`)
      .$onUpdate(() => new Date())
      .notNull(),
  },
  (table) => [
    index('applications_orgId_idx').on(table.orgId),
    index('applications_catId_idx').on(table.catId),
    index('applications_status_idx').on(table.status),
    index('applications_confirmationToken_idx').on(table.confirmationToken),
  ]
)

export const applicationFiles = sqliteTable(
  'application_files',
  {
    id: text('id').primaryKey(),
    applicationId: text('application_id')
      .notNull()
      .references(() => applications.id, { onDelete: 'cascade' }),
    fieldId: text('field_id').notNull(), // Reference to form field
    url: text('url').notNull(),
    fileType: text('file_type', { enum: applicationFileTypes }).notNull(),
    createdAt: integer('created_at', { mode: 'timestamp_ms' })
      .default(sql`(cast(unixepoch('subsecond') * 1000 as integer))`)
      .notNull(),
  },
  (table) => [index('applicationFiles_applicationId_idx').on(table.applicationId)]
)

export const applicationsRelations = relations(applications, ({ one, many }) => ({
  org: one(orgs, { fields: [applications.orgId], references: [orgs.id] }),
  cat: one(cats, { fields: [applications.catId], references: [cats.id] }),
  form: one(forms, { fields: [applications.formId], references: [forms.id] }),
  files: many(applicationFiles),
}))

export const applicationFilesRelations = relations(
  applicationFiles,
  ({ one }) => ({
    application: one(applications, {
      fields: [applicationFiles.applicationId],
      references: [applications.id],
    }),
  })
)
