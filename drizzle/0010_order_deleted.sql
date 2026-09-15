ALTER TABLE `orders` ADD `deleted` integer DEFAULT 0 NOT NULL;
ALTER TABLE `orders` ADD `deleted_by` text DEFAULT '' NOT NULL;
