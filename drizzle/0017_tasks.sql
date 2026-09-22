CREATE TABLE `tasks` (
	`id` text PRIMARY KEY NOT NULL,
	`created_at` text NOT NULL,
	`due_date` text NOT NULL,
	`partner_id` text NOT NULL,
	`supplier_id` text DEFAULT '' NOT NULL,
	`kind` text NOT NULL,
	`description` text DEFAULT '' NOT NULL,
	`done` integer DEFAULT 0 NOT NULL,
	`created_by` text DEFAULT '' NOT NULL,
	`version` integer DEFAULT 1 NOT NULL,
	FOREIGN KEY (`partner_id`) REFERENCES `partners`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE INDEX `idx_tasks_due` ON `tasks` (`due_date`,`done`);
--> statement-breakpoint
CREATE INDEX `idx_tasks_partner` ON `tasks` (`partner_id`);
