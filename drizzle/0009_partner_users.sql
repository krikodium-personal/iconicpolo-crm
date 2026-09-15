ALTER TABLE `partners` ADD `email` text DEFAULT '' NOT NULL;
ALTER TABLE `partners` ADD `password_hash` text DEFAULT '' NOT NULL;
ALTER TABLE `orders` ADD `created_by` text DEFAULT '' NOT NULL;
ALTER TABLE `orders` ADD `archived_by` text DEFAULT '' NOT NULL;
ALTER TABLE `products` ADD `created_by` text DEFAULT '' NOT NULL;
ALTER TABLE `products` ADD `archived_by` text DEFAULT '' NOT NULL;
ALTER TABLE `stock_movements` ADD `created_by` text DEFAULT '' NOT NULL;
ALTER TABLE `partner_cashouts` ADD `created_by` text DEFAULT '' NOT NULL;
CREATE TABLE `sessions` (
	`id` text PRIMARY KEY NOT NULL,
	`partner_id` text NOT NULL,
	`expires_at` text NOT NULL,
	FOREIGN KEY (`partner_id`) REFERENCES `partners`(`id`)
);
