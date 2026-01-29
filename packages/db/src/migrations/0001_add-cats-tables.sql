CREATE TABLE `cat_photos` (
	`id` text PRIMARY KEY NOT NULL,
	`cat_id` text NOT NULL,
	`url` text NOT NULL,
	`order` integer NOT NULL,
	`created_at` integer DEFAULT (cast(unixepoch('subsecond') * 1000 as integer)) NOT NULL,
	FOREIGN KEY (`cat_id`) REFERENCES `cats`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `catPhotos_catId_idx` ON `cat_photos` (`cat_id`);--> statement-breakpoint
CREATE TABLE `cats` (
	`id` text PRIMARY KEY NOT NULL,
	`org_id` text NOT NULL,
	`form_id` text,
	`name` text NOT NULL,
	`age_years` integer,
	`age_months` integer,
	`sex` text NOT NULL,
	`fiv` text NOT NULL,
	`felv` text NOT NULL,
	`castrated` integer DEFAULT false NOT NULL,
	`vaccinated` integer DEFAULT false NOT NULL,
	`vaccination_notes` text,
	`dewormed` integer DEFAULT false NOT NULL,
	`deworming_notes` text,
	`description` text NOT NULL,
	`status` text DEFAULT 'available' NOT NULL,
	`created_by` text NOT NULL,
	`created_at` integer DEFAULT (cast(unixepoch('subsecond') * 1000 as integer)) NOT NULL,
	`updated_at` integer DEFAULT (cast(unixepoch('subsecond') * 1000 as integer)) NOT NULL,
	FOREIGN KEY (`org_id`) REFERENCES `orgs`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`created_by`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE INDEX `cats_orgId_idx` ON `cats` (`org_id`);--> statement-breakpoint
CREATE INDEX `cats_status_idx` ON `cats` (`status`);