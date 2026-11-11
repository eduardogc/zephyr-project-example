CREATE TABLE `order_items` (
	`order_id` text NOT NULL,
	`product_id` text NOT NULL,
	`quantity` integer NOT NULL,
	`unit_price_cents` integer NOT NULL,
	PRIMARY KEY(`order_id`, `product_id`),
	FOREIGN KEY (`order_id`) REFERENCES `orders`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`product_id`) REFERENCES `products`(`id`) ON UPDATE no action ON DELETE no action,
	CONSTRAINT "order_items_quantity_positive" CHECK("order_items"."quantity" > 0)
);
--> statement-breakpoint
CREATE TABLE `orders` (
	`id` text PRIMARY KEY NOT NULL,
	`customer_name` text NOT NULL,
	`customer_email` text NOT NULL,
	`customer_address` text NOT NULL,
	`total_cents` integer NOT NULL,
	`created_at` text NOT NULL
);
--> statement-breakpoint
CREATE TABLE `products` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`description` text NOT NULL,
	`category` text NOT NULL,
	`price_cents` integer NOT NULL,
	`rating` real NOT NULL,
	`stock` integer NOT NULL,
	`emoji` text NOT NULL,
	`hue` integer NOT NULL,
	`position` integer NOT NULL,
	CONSTRAINT "products_stock_non_negative" CHECK("products"."stock" >= 0),
	CONSTRAINT "products_price_non_negative" CHECK("products"."price_cents" >= 0)
);
--> statement-breakpoint
CREATE INDEX `products_category_idx` ON `products` (`category`);