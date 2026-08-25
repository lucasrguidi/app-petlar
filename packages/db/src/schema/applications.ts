import { relations, sql } from 'drizzle-orm'
import {
  index,
  integer,
  sqliteTable,
  text,
  uniqueIndex,
} from 'drizzle-orm/sqlite-core'

import { user } from './auth'
import { catGroups } from './cat-groups'
import { cats } from './cats'
import { forms } from './forms'
import { orgs } from './orgs'

export const applicationStatuses = [
  'pending',
  'reviewing',
  'approved',
  'rejected',
  'permanently_rejected',
] as const

export type ApplicationStatus = (typeof applicationStatuses)[number]

export const applicationFileTypes = ['image', 'video'] as const

export type ApplicationFileType = (typeof applicationFileTypes)[number]

/**
 * Coarse platform bucket for compression diagnostics. Deliberately not the
 * device model: iOS does not expose it anyway, and storing one next to an
 * applicant's name and phone would go beyond what they consented to.
 */
export const applicationPlatforms = ['ios', 'android', 'desktop', 'other'] as const

export type ApplicationPlatform = (typeof applicationPlatforms)[number]

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
    catId: text('cat_id').references(() => cats.id, { onDelete: 'cascade' }),
    groupId: text('group_id').references(() => catGroups.id, {
      onDelete: 'set null',
    }),
    formId: text('form_id').references(() => forms.id, {
      onDelete: 'set null',
    }), // Snapshot - form may be deleted later

    // Status
    status: text('status', { enum: applicationStatuses })
      .notNull()
      .default('pending'),
    permanentRejectionReason: text('permanent_rejection_reason'),
    permanentlyRejectedAt: integer('permanently_rejected_at', {
      mode: 'timestamp_ms',
    }),
    permanentlyRejectedBy: text('permanently_rejected_by').references(
      () => user.id,
      { onDelete: 'set null' }
    ),

    // Applicant fixed data
    applicantName: text('applicant_name').notNull(),
    applicantNameNormalized: text('applicant_name_normalized')
      .notNull()
      .default(''),
    applicantEmail: text('applicant_email').notNull(),
    applicantWhatsapp: text('applicant_whatsapp').notNull(),

    // Dynamic form responses (JSON)
    responses: text('responses', {
      mode: 'json',
    }).$type<ApplicationResponses>(),

    // Consents (LGPD)
    lgpdConsent: integer('lgpd_consent', { mode: 'boolean' }).notNull(),
    whatsappConsent: integer('whatsapp_consent', { mode: 'boolean' }).notNull(),

    // Email confirmation (for phase 4.5)
    confirmationToken: text('confirmation_token').unique(),
    confirmationCodeHash: text('confirmation_code_hash'),
    confirmationCodeExpiresAt: integer('confirmation_code_expires_at', {
      mode: 'timestamp_ms',
    }),
    confirmationResendCount: integer('confirmation_resend_count')
      .notNull()
      .default(0),
    confirmationLastSentAt: integer('confirmation_last_sent_at', {
      mode: 'timestamp_ms',
    }),
    confirmedAt: integer('confirmed_at', { mode: 'timestamp_ms' }),

    // Set when this applicant has been notified that the cat/group they
    // applied for was adopted by someone else. Prevents double-sends if the
    // admin undoes and re-creates the adoption.
    closureNotifiedAt: integer('closure_notified_at', { mode: 'timestamp_ms' }),

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
    index('applications_orgId_email_idx').on(table.orgId, table.applicantEmail),
    index('applications_catId_idx').on(table.catId),
    index('applications_status_idx').on(table.status),
    index('applications_confirmationToken_idx').on(table.confirmationToken),
    index('applications_catId_email_confirmedAt_idx').on(
      table.catId,
      table.applicantEmail,
      table.confirmedAt
    ),
    index('applications_catId_confirmedAt_createdAt_idx').on(
      table.catId,
      table.confirmedAt,
      table.createdAt
    ),
    index('applications_catId_confirmedAt_status_createdAt_idx').on(
      table.catId,
      table.confirmedAt,
      table.status,
      table.createdAt
    ),
    index('applications_catId_confirmedAt_nameNormalized_idx').on(
      table.catId,
      table.confirmedAt,
      table.applicantNameNormalized
    ),
    index('applications_groupId_idx').on(table.groupId),
    index('applications_groupId_confirmedAt_createdAt_idx').on(
      table.groupId,
      table.confirmedAt,
      table.createdAt
    ),
  ]
)

export const permanentRejections = sqliteTable(
  'permanent_rejections',
  {
    id: text('id').primaryKey(),
    orgId: text('org_id')
      .notNull()
      .references(() => orgs.id, { onDelete: 'cascade' }),
    applicantEmail: text('applicant_email').notNull(),
    reason: text('reason').notNull(),
    active: integer('active', { mode: 'boolean' }).notNull().default(true),
    createdBy: text('created_by')
      .notNull()
      .references(() => user.id),
    revokedBy: text('revoked_by').references(() => user.id, {
      onDelete: 'set null',
    }),
    revokedAt: integer('revoked_at', { mode: 'timestamp_ms' }),
    createdAt: integer('created_at', { mode: 'timestamp_ms' })
      .default(sql`(cast(unixepoch('subsecond') * 1000 as integer))`)
      .notNull(),
    updatedAt: integer('updated_at', { mode: 'timestamp_ms' })
      .default(sql`(cast(unixepoch('subsecond') * 1000 as integer))`)
      .$onUpdate(() => new Date())
      .notNull(),
  },
  (table) => [
    uniqueIndex('permanentRejections_orgId_email_unique').on(
      table.orgId,
      table.applicantEmail
    ),
    index('permanentRejections_orgId_active_idx').on(table.orgId, table.active),
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
    // Metadata reported by the client at upload time (nullable for legacy rows)
    sizeBytes: integer('size_bytes'),
    mimeType: text('mime_type'),
    durationSeconds: integer('duration_seconds'),

    // Compression diagnostics: is transcoding fast enough on weak phones?
    // Deliberately coarse — no device model, nothing that identifies a person.
    originalSizeBytes: integer('original_size_bytes'),
    originalWidth: integer('original_width'),
    originalHeight: integer('original_height'),
    compressionMs: integer('compression_ms'),
    hardwareConcurrency: integer('hardware_concurrency'),
    platform: text('platform', { enum: applicationPlatforms }),
    createdAt: integer('created_at', { mode: 'timestamp_ms' })
      .default(sql`(cast(unixepoch('subsecond') * 1000 as integer))`)
      .notNull(),
  },
  (table) => [
    index('applicationFiles_applicationId_idx').on(table.applicationId),
  ]
)

export const applicationsRelations = relations(
  applications,
  ({ one, many }) => ({
    org: one(orgs, { fields: [applications.orgId], references: [orgs.id] }),
    cat: one(cats, { fields: [applications.catId], references: [cats.id] }),
    group: one(catGroups, {
      fields: [applications.groupId],
      references: [catGroups.id],
    }),
    form: one(forms, { fields: [applications.formId], references: [forms.id] }),
    files: many(applicationFiles),
  })
)

export const applicationFilesRelations = relations(
  applicationFiles,
  ({ one }) => ({
    application: one(applications, {
      fields: [applicationFiles.applicationId],
      references: [applications.id],
    }),
  })
)
