CREATE TABLE `cat_groups` (
	`id` text PRIMARY KEY NOT NULL,
	`org_id` text NOT NULL,
	`form_id` text NOT NULL,
	`form_snapshot` text,
	`created_by` text NOT NULL,
	`created_at` integer DEFAULT (cast(unixepoch('subsecond') * 1000 as integer)) NOT NULL,
	`updated_at` integer DEFAULT (cast(unixepoch('subsecond') * 1000 as integer)) NOT NULL,
	FOREIGN KEY (`org_id`) REFERENCES `orgs`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`form_id`) REFERENCES `forms`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`created_by`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE INDEX `cat_groups_orgId_idx` ON `cat_groups` (`org_id`);--> statement-breakpoint
PRAGMA foreign_keys=OFF;--> statement-breakpoint
CREATE TABLE `__new_applications` (
	`id` text PRIMARY KEY NOT NULL,
	`org_id` text NOT NULL,
	`cat_id` text,
	`group_id` text,
	`form_id` text,
	`status` text DEFAULT 'pending' NOT NULL,
	`permanent_rejection_reason` text,
	`permanently_rejected_at` integer,
	`permanently_rejected_by` text,
	`applicant_name` text NOT NULL,
	`applicant_name_normalized` text DEFAULT '' NOT NULL,
	`applicant_email` text NOT NULL,
	`applicant_whatsapp` text NOT NULL,
	`responses` text,
	`lgpd_consent` integer NOT NULL,
	`whatsapp_consent` integer NOT NULL,
	`confirmation_token` text,
	`confirmation_code_hash` text,
	`confirmation_code_expires_at` integer,
	`confirmation_resend_count` integer DEFAULT 0 NOT NULL,
	`confirmation_last_sent_at` integer,
	`confirmed_at` integer,
	`created_at` integer DEFAULT (cast(unixepoch('subsecond') * 1000 as integer)) NOT NULL,
	`updated_at` integer DEFAULT (cast(unixepoch('subsecond') * 1000 as integer)) NOT NULL,
	FOREIGN KEY (`org_id`) REFERENCES `orgs`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`cat_id`) REFERENCES `cats`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`group_id`) REFERENCES `cat_groups`(`id`) ON UPDATE no action ON DELETE set null,
	FOREIGN KEY (`form_id`) REFERENCES `forms`(`id`) ON UPDATE no action ON DELETE set null,
	FOREIGN KEY (`permanently_rejected_by`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE set null
);
--> statement-breakpoint
INSERT INTO `__new_applications`("id", "org_id", "cat_id", "group_id", "form_id", "status", "permanent_rejection_reason", "permanently_rejected_at", "permanently_rejected_by", "applicant_name", "applicant_name_normalized", "applicant_email", "applicant_whatsapp", "responses", "lgpd_consent", "whatsapp_consent", "confirmation_token", "confirmation_code_hash", "confirmation_code_expires_at", "confirmation_resend_count", "confirmation_last_sent_at", "confirmed_at", "created_at", "updated_at") SELECT "id", "org_id", "cat_id", NULL, "form_id", "status", "permanent_rejection_reason", "permanently_rejected_at", "permanently_rejected_by", "applicant_name", "applicant_name_normalized", "applicant_email", "applicant_whatsapp", "responses", "lgpd_consent", "whatsapp_consent", "confirmation_token", "confirmation_code_hash", "confirmation_code_expires_at", "confirmation_resend_count", "confirmation_last_sent_at", "confirmed_at", "created_at", "updated_at" FROM `applications`;--> statement-breakpoint
DROP TABLE `applications`;--> statement-breakpoint
ALTER TABLE `__new_applications` RENAME TO `applications`;--> statement-breakpoint
PRAGMA foreign_keys=ON;--> statement-breakpoint
CREATE UNIQUE INDEX `applications_confirmation_token_unique` ON `applications` (`confirmation_token`);--> statement-breakpoint
CREATE INDEX `applications_orgId_idx` ON `applications` (`org_id`);--> statement-breakpoint
CREATE INDEX `applications_orgId_email_idx` ON `applications` (`org_id`,`applicant_email`);--> statement-breakpoint
CREATE INDEX `applications_catId_idx` ON `applications` (`cat_id`);--> statement-breakpoint
CREATE INDEX `applications_status_idx` ON `applications` (`status`);--> statement-breakpoint
CREATE INDEX `applications_confirmationToken_idx` ON `applications` (`confirmation_token`);--> statement-breakpoint
CREATE INDEX `applications_catId_email_confirmedAt_idx` ON `applications` (`cat_id`,`applicant_email`,`confirmed_at`);--> statement-breakpoint
CREATE INDEX `applications_catId_confirmedAt_createdAt_idx` ON `applications` (`cat_id`,`confirmed_at`,`created_at`);--> statement-breakpoint
CREATE INDEX `applications_catId_confirmedAt_status_createdAt_idx` ON `applications` (`cat_id`,`confirmed_at`,`status`,`created_at`);--> statement-breakpoint
CREATE INDEX `applications_catId_confirmedAt_nameNormalized_idx` ON `applications` (`cat_id`,`confirmed_at`,`applicant_name_normalized`);--> statement-breakpoint
CREATE INDEX `applications_groupId_idx` ON `applications` (`group_id`);--> statement-breakpoint
CREATE INDEX `applications_groupId_confirmedAt_createdAt_idx` ON `applications` (`group_id`,`confirmed_at`,`created_at`);--> statement-breakpoint
ALTER TABLE `adoptions` ADD `group_id` text REFERENCES cat_groups(id);--> statement-breakpoint
CREATE INDEX `adoptions_groupId_idx` ON `adoptions` (`group_id`);--> statement-breakpoint
ALTER TABLE `cats` ADD `group_id` text REFERENCES cat_groups(id);--> statement-breakpoint
CREATE INDEX `cats_groupId_idx` ON `cats` (`group_id`);