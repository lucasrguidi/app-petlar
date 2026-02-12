ALTER TABLE `applications` ADD `applicant_name_normalized` text DEFAULT '' NOT NULL;--> statement-breakpoint
UPDATE `applications`
SET `applicant_name_normalized` = replace(replace(replace(replace(replace(replace(replace(replace(replace(replace(replace(replace(replace(replace(replace(replace(replace(replace(replace(replace(replace(replace(replace(replace(lower(`applicant_name`), 'á', 'a'), 'à', 'a'), 'â', 'a'), 'ã', 'a'), 'ä', 'a'), 'é', 'e'), 'è', 'e'), 'ê', 'e'), 'ë', 'e'), 'í', 'i'), 'ì', 'i'), 'î', 'i'), 'ï', 'i'), 'ó', 'o'), 'ò', 'o'), 'ô', 'o'), 'õ', 'o'), 'ö', 'o'), 'ú', 'u'), 'ù', 'u'), 'û', 'u'), 'ü', 'u'), 'ç', 'c'), 'ñ', 'n')
WHERE `applicant_name_normalized` = '';--> statement-breakpoint
CREATE INDEX `applications_catId_confirmedAt_createdAt_idx` ON `applications` (`cat_id`,`confirmed_at`,`created_at`);--> statement-breakpoint
CREATE INDEX `applications_catId_confirmedAt_status_createdAt_idx` ON `applications` (`cat_id`,`confirmed_at`,`status`,`created_at`);--> statement-breakpoint
CREATE INDEX `applications_catId_confirmedAt_nameNormalized_idx` ON `applications` (`cat_id`,`confirmed_at`,`applicant_name_normalized`);--> statement-breakpoint
ALTER TABLE `cats` ADD `form_snapshot` text;
