ALTER TABLE `orders` ADD `shipping_carrier` text DEFAULT '' NOT NULL;--> statement-breakpoint
ALTER TABLE `orders` ADD `shipping_amount` integer DEFAULT 0 NOT NULL;
