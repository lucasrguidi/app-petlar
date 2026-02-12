ALTER TABLE `applications` ADD `confirmation_code_hash` text;--> statement-breakpoint
ALTER TABLE `applications` ADD `confirmation_code_expires_at` integer;--> statement-breakpoint
ALTER TABLE `applications` ADD `confirmation_resend_count` integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE `applications` ADD `confirmation_last_sent_at` integer;--> statement-breakpoint
CREATE INDEX `applications_catId_email_confirmedAt_idx` ON `applications` (`cat_id`,`applicant_email`,`confirmed_at`);