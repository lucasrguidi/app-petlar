CREATE TABLE `adoptions` (
	`id` text PRIMARY KEY NOT NULL,
	`org_id` text NOT NULL,
	`cat_id` text NOT NULL,
	`application_id` text,
	`adopter_name` text NOT NULL,
	`adopter_name_normalized` text DEFAULT '' NOT NULL,
	`adopter_phone` text NOT NULL,
	`adopter_email` text,
	`adoption_date` text NOT NULL,
	`adoption_term_url` text,
	`notes` text,
	`created_by` text NOT NULL,
	`created_at` integer DEFAULT (cast(unixepoch('subsecond') * 1000 as integer)) NOT NULL,
	`updated_at` integer DEFAULT (cast(unixepoch('subsecond') * 1000 as integer)) NOT NULL,
	FOREIGN KEY (`org_id`) REFERENCES `orgs`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`cat_id`) REFERENCES `cats`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`application_id`) REFERENCES `applications`(`id`) ON UPDATE no action ON DELETE set null,
	FOREIGN KEY (`created_by`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE INDEX `adoptions_orgId_idx` ON `adoptions` (`org_id`);--> statement-breakpoint
CREATE INDEX `adoptions_adoptionDate_idx` ON `adoptions` (`adoption_date`);--> statement-breakpoint
CREATE INDEX `adoptions_orgId_adoptionDate_idx` ON `adoptions` (`org_id`,`adoption_date`);--> statement-breakpoint
CREATE INDEX `adoptions_orgId_adopterNameNormalized_idx` ON `adoptions` (`org_id`,`adopter_name_normalized`);--> statement-breakpoint
CREATE UNIQUE INDEX `adoptions_catId_unique` ON `adoptions` (`cat_id`);