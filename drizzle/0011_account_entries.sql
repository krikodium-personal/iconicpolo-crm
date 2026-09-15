CREATE TABLE `account_entries` (
	`id` text PRIMARY KEY NOT NULL,
	`concept` text NOT NULL,
	`detail` text DEFAULT '' NOT NULL,
	`partner_id` text NOT NULL,
	`amount` integer NOT NULL,
	`currency` text NOT NULL,
	`date` text NOT NULL,
	`created_at` text NOT NULL,
	`created_by` text DEFAULT '' NOT NULL,
	FOREIGN KEY (`partner_id`) REFERENCES `partners`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE INDEX `idx_account_entries_date` ON `account_entries` (`date`);
