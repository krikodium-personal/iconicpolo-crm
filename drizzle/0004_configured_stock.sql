ALTER TABLE `products` ADD `kind` text DEFAULT 'sku' NOT NULL;
--> statement-breakpoint
ALTER TABLE `stock_movements` ADD `config` text DEFAULT '{}' NOT NULL;
--> statement-breakpoint
ALTER TABLE `stock_movements` ADD `config_key` text DEFAULT '' NOT NULL;
--> statement-breakpoint
CREATE INDEX `idx_stock_product_config` ON `stock_movements` (`product_id`,`config_key`);
