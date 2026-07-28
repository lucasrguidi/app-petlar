CREATE TABLE `cat_group_photos` (
	`id` text PRIMARY KEY NOT NULL,
	`group_id` text NOT NULL,
	`url` text NOT NULL,
	`order` integer NOT NULL,
	`created_at` integer DEFAULT (cast(unixepoch('subsecond') * 1000 as integer)) NOT NULL,
	FOREIGN KEY (`group_id`) REFERENCES `cat_groups`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `catGroupPhotos_groupId_idx` ON `cat_group_photos` (`group_id`);