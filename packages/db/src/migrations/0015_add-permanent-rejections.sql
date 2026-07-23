CREATE TABLE `permanent_rejections` (
	`id` text PRIMARY KEY NOT NULL,
	`org_id` text NOT NULL,
	`applicant_email` text NOT NULL,
	`reason` text NOT NULL,
	`active` integer DEFAULT true NOT NULL,
	`created_by` text NOT NULL,
	`revoked_by` text,
	`revoked_at` integer,
	`created_at` integer DEFAULT (cast(unixepoch('subsecond') * 1000 as integer)) NOT NULL,
	`updated_at` integer DEFAULT (cast(unixepoch('subsecond') * 1000 as integer)) NOT NULL,
	FOREIGN KEY (`org_id`) REFERENCES `orgs`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`created_by`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`revoked_by`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE set null
);
--> statement-breakpoint
CREATE UNIQUE INDEX `permanentRejections_orgId_email_unique` ON `permanent_rejections` (`org_id`,`applicant_email`);--> statement-breakpoint
CREATE INDEX `permanentRejections_orgId_active_idx` ON `permanent_rejections` (`org_id`,`active`);--> statement-breakpoint
ALTER TABLE `applications` ADD `permanent_rejection_reason` text;--> statement-breakpoint
ALTER TABLE `applications` ADD `permanently_rejected_at` integer;--> statement-breakpoint
ALTER TABLE `applications` ADD `permanently_rejected_by` text REFERENCES user(id) ON DELETE SET NULL;--> statement-breakpoint
CREATE INDEX `applications_orgId_email_idx` ON `applications` (`org_id`,`applicant_email`);
