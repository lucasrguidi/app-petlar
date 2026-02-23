PRAGMA foreign_keys=OFF;--> statement-breakpoint
CREATE TABLE `__new_user` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`email` text NOT NULL,
	`contact_email` text NOT NULL,
	`contact_email_normalized` text NOT NULL,
	`email_verified` integer DEFAULT false NOT NULL,
	`image` text,
	`org_id` text NOT NULL,
	`role` text DEFAULT 'volunteer' NOT NULL,
	`active` integer DEFAULT true NOT NULL,
	`last_login_at` integer,
	`last_seen_at` integer,
	`created_at` integer DEFAULT (cast(unixepoch('subsecond') * 1000 as integer)) NOT NULL,
	`updated_at` integer DEFAULT (cast(unixepoch('subsecond') * 1000 as integer)) NOT NULL,
	FOREIGN KEY (`org_id`) REFERENCES `orgs`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
INSERT INTO `__new_user`(
	"id",
	"name",
	"email",
	"contact_email",
	"contact_email_normalized",
	"email_verified",
	"image",
	"org_id",
	"role",
	"active",
	"last_login_at",
	"last_seen_at",
	"created_at",
	"updated_at"
) SELECT
	"id",
	"name",
	"email",
	"email",
	lower("email"),
	"email_verified",
	"image",
	"org_id",
	"role",
	"active",
	"last_login_at",
	"last_seen_at",
	"created_at",
	"updated_at"
FROM `user`
WHERE "org_id" IS NOT NULL;--> statement-breakpoint
DROP TABLE `user`;--> statement-breakpoint
ALTER TABLE `__new_user` RENAME TO `user`;--> statement-breakpoint
PRAGMA foreign_keys=ON;--> statement-breakpoint
CREATE UNIQUE INDEX `user_email_unique` ON `user` (`email`);--> statement-breakpoint
CREATE INDEX `user_orgId_idx` ON `user` (`org_id`);--> statement-breakpoint
CREATE UNIQUE INDEX `user_org_email_unique` ON `user` (`org_id`,`contact_email_normalized`);--> statement-breakpoint
CREATE INDEX `user_contact_email_idx` ON `user` (`contact_email_normalized`);
