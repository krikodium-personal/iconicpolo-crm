CREATE TABLE `partners` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`archived` integer DEFAULT 0 NOT NULL,
	`version` integer DEFAULT 1 NOT NULL
);
--> statement-breakpoint
CREATE TABLE `account_expenses` (
	`id` text PRIMARY KEY NOT NULL,
	`kind` text NOT NULL,
	`amount` integer NOT NULL,
	`date` text NOT NULL,
	`notes` text DEFAULT '' NOT NULL,
	`created_at` text NOT NULL
);
--> statement-breakpoint
CREATE INDEX `idx_expenses_date` ON `account_expenses` (`date`);--> statement-breakpoint
CREATE TABLE `partner_cashouts` (
	`id` text PRIMARY KEY NOT NULL,
	`partner_id` text NOT NULL,
	`amount` integer NOT NULL,
	`date` text NOT NULL,
	`notes` text DEFAULT '' NOT NULL,
	`created_at` text NOT NULL,
	FOREIGN KEY (`partner_id`) REFERENCES `partners`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE INDEX `idx_cashouts_partner_date` ON `partner_cashouts` (`partner_id`,`date`);
