ALTER TABLE `user` ADD `last_seen_at` integer;
--> statement-breakpoint
UPDATE `user`
SET `last_seen_at` = `last_login_at`
WHERE `last_login_at` IS NOT NULL
  AND `last_seen_at` IS NULL;
