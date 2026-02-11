CREATE TABLE `form_fields` (
	`id` text PRIMARY KEY NOT NULL,
	`form_id` text NOT NULL,
	`order` integer NOT NULL,
	`type` text NOT NULL,
	`label` text NOT NULL,
	`required` integer DEFAULT false NOT NULL,
	`help_text` text,
	`options` text,
	`condition` text,
	`media_config` text,
	`created_at` integer DEFAULT (cast(unixepoch('subsecond') * 1000 as integer)) NOT NULL,
	`updated_at` integer DEFAULT (cast(unixepoch('subsecond') * 1000 as integer)) NOT NULL,
	FOREIGN KEY (`form_id`) REFERENCES `forms`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `formFields_formId_idx` ON `form_fields` (`form_id`);--> statement-breakpoint
CREATE INDEX `formFields_formId_order_idx` ON `form_fields` (`form_id`,`order`);--> statement-breakpoint
CREATE TABLE `forms` (
	`id` text PRIMARY KEY NOT NULL,
	`org_id` text NOT NULL,
	`name` text NOT NULL,
	`description` text,
	`active` integer DEFAULT true NOT NULL,
	`created_at` integer DEFAULT (cast(unixepoch('subsecond') * 1000 as integer)) NOT NULL,
	`updated_at` integer DEFAULT (cast(unixepoch('subsecond') * 1000 as integer)) NOT NULL,
	FOREIGN KEY (`org_id`) REFERENCES `orgs`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `forms_orgId_idx` ON `forms` (`org_id`);--> statement-breakpoint
DROP INDEX "account_userId_idx";--> statement-breakpoint
DROP INDEX "session_token_unique";--> statement-breakpoint
DROP INDEX "session_userId_idx";--> statement-breakpoint
DROP INDEX "user_email_unique";--> statement-breakpoint
DROP INDEX "user_orgId_idx";--> statement-breakpoint
DROP INDEX "verification_identifier_idx";--> statement-breakpoint
DROP INDEX "catPhotos_catId_idx";--> statement-breakpoint
DROP INDEX "cats_orgId_idx";--> statement-breakpoint
DROP INDEX "cats_status_idx";--> statement-breakpoint
DROP INDEX "orgs_slug_idx";--> statement-breakpoint
ALTER TABLE `cats` ALTER COLUMN "description" TO "description" text;--> statement-breakpoint
CREATE INDEX `account_userId_idx` ON `account` (`user_id`);--> statement-breakpoint
CREATE UNIQUE INDEX `session_token_unique` ON `session` (`token`);--> statement-breakpoint
CREATE INDEX `session_userId_idx` ON `session` (`user_id`);--> statement-breakpoint
CREATE UNIQUE INDEX `user_email_unique` ON `user` (`email`);--> statement-breakpoint
CREATE INDEX `user_orgId_idx` ON `user` (`org_id`);--> statement-breakpoint
CREATE INDEX `verification_identifier_idx` ON `verification` (`identifier`);--> statement-breakpoint
CREATE INDEX `catPhotos_catId_idx` ON `cat_photos` (`cat_id`);--> statement-breakpoint
CREATE INDEX `cats_orgId_idx` ON `cats` (`org_id`);--> statement-breakpoint
CREATE INDEX `cats_status_idx` ON `cats` (`status`);--> statement-breakpoint
CREATE UNIQUE INDEX `orgs_slug_idx` ON `orgs` (`slug`);
