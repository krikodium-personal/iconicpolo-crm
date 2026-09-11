CREATE TABLE `categories` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`fields` text DEFAULT '[]' NOT NULL
);
--> statement-breakpoint
CREATE TABLE `contacts` (
	`id` text PRIMARY KEY NOT NULL,
	`kind` text NOT NULL,
	`name` text NOT NULL,
	`contact` text DEFAULT '' NOT NULL,
	`address` text DEFAULT '' NOT NULL,
	`phone` text DEFAULT '' NOT NULL,
	`email` text DEFAULT '' NOT NULL,
	`website` text DEFAULT '' NOT NULL,
	`notes` text DEFAULT '' NOT NULL,
	`fiscal` text DEFAULT '{}' NOT NULL,
	`archived` integer DEFAULT 0 NOT NULL,
	`version` integer DEFAULT 1 NOT NULL
);
--> statement-breakpoint
CREATE INDEX `idx_contacts_kind` ON `contacts` (`kind`,`archived`);--> statement-breakpoint
CREATE TABLE `images` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`mime` text NOT NULL,
	`size` integer NOT NULL,
	`created_at` text NOT NULL
);
--> statement-breakpoint
CREATE TABLE `order_items` (
	`id` text PRIMARY KEY NOT NULL,
	`order_id` text NOT NULL,
	`product_id` text NOT NULL,
	`name` text NOT NULL,
	`sku` text NOT NULL,
	`selections` text NOT NULL,
	`unit_price` integer NOT NULL,
	`unit_cost` integer NOT NULL,
	`quantity` integer NOT NULL,
	`discount` integer NOT NULL,
	`total` integer NOT NULL,
	`cost` integer NOT NULL,
	FOREIGN KEY (`order_id`) REFERENCES `orders`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`product_id`) REFERENCES `products`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE INDEX `idx_items_order` ON `order_items` (`order_id`);--> statement-breakpoint
CREATE TABLE `orders` (
	`id` text PRIMARY KEY NOT NULL,
	`number` text NOT NULL,
	`customer_id` text NOT NULL,
	`date` text NOT NULL,
	`delivery` text DEFAULT '' NOT NULL,
	`status` text DEFAULT 'nuevo' NOT NULL,
	`paid` integer DEFAULT 0 NOT NULL,
	`invoice` integer DEFAULT 0 NOT NULL,
	`notes` text DEFAULT '' NOT NULL,
	`currency` text DEFAULT 'ARS' NOT NULL,
	`total` integer NOT NULL,
	`cost` integer NOT NULL,
	`archived` integer DEFAULT 0 NOT NULL,
	`version` integer DEFAULT 1 NOT NULL,
	FOREIGN KEY (`customer_id`) REFERENCES `contacts`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE UNIQUE INDEX `orders_number_unique` ON `orders` (`number`);--> statement-breakpoint
CREATE INDEX `idx_orders_customer_date` ON `orders` (`customer_id`,`date`);--> statement-breakpoint
CREATE TABLE `products` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`sku` text NOT NULL,
	`category` text NOT NULL,
	`supplier_id` text,
	`cost` integer NOT NULL,
	`price` integer NOT NULL,
	`ff_discount` integer DEFAULT 0 NOT NULL,
	`promo_kind` text DEFAULT 'none' NOT NULL,
	`promo_value` integer DEFAULT 0 NOT NULL,
	`photos` text DEFAULT '[]' NOT NULL,
	`options` text DEFAULT '[]' NOT NULL,
	`attributes` text DEFAULT '{}' NOT NULL,
	`archived` integer DEFAULT 0 NOT NULL,
	`version` integer DEFAULT 1 NOT NULL,
	FOREIGN KEY (`category`) REFERENCES `categories`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`supplier_id`) REFERENCES `contacts`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE UNIQUE INDEX `products_sku_unique` ON `products` (`sku`);--> statement-breakpoint
CREATE INDEX `idx_products_supplier` ON `products` (`supplier_id`);--> statement-breakpoint
CREATE TABLE `settings` (
	`id` integer PRIMARY KEY NOT NULL,
	`currency` text DEFAULT 'ARS' NOT NULL
);
--> statement-breakpoint
CREATE TABLE `stock_movements` (
	`id` text PRIMARY KEY NOT NULL,
	`product_id` text NOT NULL,
	`order_id` text,
	`quantity` integer NOT NULL,
	`reason` text NOT NULL,
	`created_at` text NOT NULL,
	FOREIGN KEY (`product_id`) REFERENCES `products`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`order_id`) REFERENCES `orders`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE INDEX `idx_stock_product` ON `stock_movements` (`product_id`);--> statement-breakpoint
CREATE TRIGGER stock_no_negative BEFORE INSERT ON stock_movements WHEN NEW.quantity + COALESCE((SELECT SUM(quantity) FROM stock_movements WHERE product_id=NEW.product_id),0) < 0 BEGIN SELECT RAISE(ABORT,'STOCK_NEGATIVE'); END;
--> statement-breakpoint
CREATE TRIGGER stock_immutable_update BEFORE UPDATE ON stock_movements BEGIN SELECT RAISE(ABORT,'STOCK_IMMUTABLE'); END;
--> statement-breakpoint
CREATE TRIGGER stock_immutable_delete BEFORE DELETE ON stock_movements BEGIN SELECT RAISE(ABORT,'STOCK_IMMUTABLE'); END;
--> statement-breakpoint
CREATE TRIGGER orders_version BEFORE UPDATE ON orders WHEN NEW.version != OLD.version+1 BEGIN SELECT RAISE(ABORT,'STALE_VERSION'); END;
--> statement-breakpoint
CREATE TRIGGER contacts_version BEFORE UPDATE ON contacts WHEN NEW.version != OLD.version+1 BEGIN SELECT RAISE(ABORT,'STALE_VERSION'); END;
--> statement-breakpoint
CREATE TRIGGER products_version BEFORE UPDATE ON products WHEN NEW.version != OLD.version+1 BEGIN SELECT RAISE(ABORT,'STALE_VERSION'); END;
--> statement-breakpoint
CREATE TRIGGER order_closed_stock AFTER UPDATE OF status ON orders WHEN NEW.status='cerrado' AND OLD.status!='cerrado' BEGIN INSERT INTO stock_movements(id,product_id,order_id,quantity,reason,created_at) SELECT lower(hex(randomblob(16))),product_id,NEW.id,-quantity,'Cierre '||NEW.number,strftime('%Y-%m-%dT%H:%M:%fZ','now') FROM order_items WHERE order_id=NEW.id; END;
--> statement-breakpoint
CREATE TRIGGER order_reopened_stock AFTER UPDATE OF status ON orders WHEN OLD.status='cerrado' AND NEW.status!='cerrado' BEGIN INSERT INTO stock_movements(id,product_id,order_id,quantity,reason,created_at) SELECT lower(hex(randomblob(16))),product_id,NEW.id,quantity,'Reapertura '||NEW.number,strftime('%Y-%m-%dT%H:%M:%fZ','now') FROM order_items WHERE order_id=NEW.id; END;
