ALTER TABLE `user` ADD `org_id` text REFERENCES orgs(id);--> statement-breakpoint
ALTER TABLE `user` ADD `role` text DEFAULT 'volunteer' NOT NULL;--> statement-breakpoint
CREATE INDEX `user_orgId_idx` ON `user` (`org_id`);