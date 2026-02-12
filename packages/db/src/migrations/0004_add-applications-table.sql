CREATE TABLE `application_files` (
	`id` text PRIMARY KEY NOT NULL,
	`application_id` text NOT NULL,
	`field_id` text NOT NULL,
	`url` text NOT NULL,
	`file_type` text NOT NULL,
	`created_at` integer DEFAULT (cast(unixepoch('subsecond') * 1000 as integer)) NOT NULL,
	FOREIGN KEY (`application_id`) REFERENCES `applications`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `applicationFiles_applicationId_idx` ON `application_files` (`application_id`);--> statement-breakpoint
CREATE TABLE `applications` (
	`id` text PRIMARY KEY NOT NULL,
	`org_id` text NOT NULL,
	`cat_id` text NOT NULL,
	`form_id` text,
	`status` text DEFAULT 'pending' NOT NULL,
	`applicant_name` text NOT NULL,
	`applicant_email` text NOT NULL,
	`applicant_whatsapp` text NOT NULL,
	`responses` text,
	`lgpd_consent` integer NOT NULL,
	`whatsapp_consent` integer NOT NULL,
	`confirmation_token` text,
	`confirmed_at` integer,
	`created_at` integer DEFAULT (cast(unixepoch('subsecond') * 1000 as integer)) NOT NULL,
	`updated_at` integer DEFAULT (cast(unixepoch('subsecond') * 1000 as integer)) NOT NULL,
	FOREIGN KEY (`org_id`) REFERENCES `orgs`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`cat_id`) REFERENCES `cats`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`form_id`) REFERENCES `forms`(`id`) ON UPDATE no action ON DELETE set null
);
--> statement-breakpoint
CREATE UNIQUE INDEX `applications_confirmation_token_unique` ON `applications` (`confirmation_token`);--> statement-breakpoint
CREATE INDEX `applications_orgId_idx` ON `applications` (`org_id`);--> statement-breakpoint
CREATE INDEX `applications_catId_idx` ON `applications` (`cat_id`);--> statement-breakpoint
CREATE INDEX `applications_status_idx` ON `applications` (`status`);--> statement-breakpoint
CREATE INDEX `applications_confirmationToken_idx` ON `applications` (`confirmation_token`);