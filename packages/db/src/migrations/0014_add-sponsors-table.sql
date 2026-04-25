CREATE TABLE `sponsors` (
	`id` text PRIMARY KEY NOT NULL,
	`org_id` text NOT NULL,
	`name` text NOT NULL,
	`logo_url` text NOT NULL,
	`website_url` text NOT NULL,
	`featured` integer DEFAULT false NOT NULL,
	`order` integer NOT NULL,
	`created_at` integer DEFAULT (cast(unixepoch('subsecond') * 1000 as integer)) NOT NULL,
	`updated_at` integer DEFAULT (cast(unixepoch('subsecond') * 1000 as integer)) NOT NULL,
	FOREIGN KEY (`org_id`) REFERENCES `orgs`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `sponsors_orgId_idx` ON `sponsors` (`org_id`);--> statement-breakpoint
CREATE INDEX `sponsors_orgId_order_idx` ON `sponsors` (`org_id`,`order`);