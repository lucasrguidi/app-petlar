PRAGMA foreign_keys=OFF;--> statement-breakpoint
INSERT INTO `forms` (`id`, `org_id`, `name`, `description`, `active`, `created_at`, `updated_at`)
SELECT
	lower(hex(randomblob(16))),
	c.`org_id`,
	'Formulário padrão de adoção',
	'Criado automaticamente para compatibilidade da migração de candidaturas.',
	true,
	cast(unixepoch('subsecond') * 1000 as integer),
	cast(unixepoch('subsecond') * 1000 as integer)
FROM `cats` c
WHERE c.`form_id` IS NULL
	AND NOT EXISTS (
		SELECT 1
		FROM `forms` f
		WHERE f.`org_id` = c.`org_id`
			AND f.`name` = 'Formulário padrão de adoção'
	)
GROUP BY c.`org_id`;--> statement-breakpoint
UPDATE `cats`
SET `form_id` = (
	SELECT f.`id`
	FROM `forms` f
	WHERE f.`org_id` = `cats`.`org_id`
	ORDER BY
		CASE
			WHEN f.`name` = 'Formulário padrão de adoção' THEN 0
			ELSE 1
		END,
		f.`created_at` DESC
	LIMIT 1
)
WHERE `cats`.`form_id` IS NULL;--> statement-breakpoint
CREATE TABLE `__new_cats` (
	`id` text PRIMARY KEY NOT NULL,
	`org_id` text NOT NULL,
	`form_id` text NOT NULL,
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
	`description` text,
	`status` text DEFAULT 'available' NOT NULL,
	`created_by` text NOT NULL,
	`created_at` integer DEFAULT (cast(unixepoch('subsecond') * 1000 as integer)) NOT NULL,
	`updated_at` integer DEFAULT (cast(unixepoch('subsecond') * 1000 as integer)) NOT NULL,
	FOREIGN KEY (`org_id`) REFERENCES `orgs`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`form_id`) REFERENCES `forms`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`created_by`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
INSERT INTO `__new_cats`("id", "org_id", "form_id", "name", "age_years", "age_months", "sex", "fiv", "felv", "castrated", "vaccinated", "vaccination_notes", "dewormed", "deworming_notes", "description", "status", "created_by", "created_at", "updated_at") SELECT "id", "org_id", "form_id", "name", "age_years", "age_months", "sex", "fiv", "felv", "castrated", "vaccinated", "vaccination_notes", "dewormed", "deworming_notes", "description", "status", "created_by", "created_at", "updated_at" FROM `cats`;--> statement-breakpoint
DROP TABLE `cats`;--> statement-breakpoint
ALTER TABLE `__new_cats` RENAME TO `cats`;--> statement-breakpoint
PRAGMA foreign_keys=ON;--> statement-breakpoint
CREATE INDEX `cats_orgId_idx` ON `cats` (`org_id`);--> statement-breakpoint
CREATE INDEX `cats_status_idx` ON `cats` (`status`);
