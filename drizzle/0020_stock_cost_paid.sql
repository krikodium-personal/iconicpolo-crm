ALTER TABLE `stock_movements` ADD `cost_paid` integer DEFAULT 0 NOT NULL;
ALTER TABLE `stock_movements` ADD `paid_partner_id` text DEFAULT '' NOT NULL;
