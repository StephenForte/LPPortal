CREATE TABLE `companies` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`website` text,
	`logo_url` text,
	`description` text,
	`sector_tags` text,
	`status` text NOT NULL
);
--> statement-breakpoint
CREATE TABLE `fund_company_positions` (
	`id` text PRIMARY KEY NOT NULL,
	`fund_id` text NOT NULL,
	`company_id` text NOT NULL,
	`instrument_type` text NOT NULL,
	`cost_basis_cents` integer NOT NULL,
	`current_mark_cents` integer NOT NULL,
	`mark_date` text NOT NULL,
	`shares` integer,
	`pro_rata_rights` integer DEFAULT false NOT NULL,
	`pro_rata_notes` text,
	`tags` text,
	FOREIGN KEY (`fund_id`) REFERENCES `funds`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`company_id`) REFERENCES `companies`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE UNIQUE INDEX `fund_company_unique` ON `fund_company_positions` (`fund_id`,`company_id`);--> statement-breakpoint
CREATE TABLE `funds` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`vintage_year` integer NOT NULL,
	`size_cents` integer NOT NULL,
	`currency` text DEFAULT 'USD' NOT NULL,
	`status` text NOT NULL
);
--> statement-breakpoint
CREATE TABLE `lp_fund_positions` (
	`id` text PRIMARY KEY NOT NULL,
	`lp_id` text NOT NULL,
	`fund_id` text NOT NULL,
	`committed_cents` integer NOT NULL,
	`called_cents` integer NOT NULL,
	`distributed_cents` integer NOT NULL,
	`ownership_pct` real NOT NULL,
	FOREIGN KEY (`lp_id`) REFERENCES `lps`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`fund_id`) REFERENCES `funds`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE UNIQUE INDEX `lp_fund_unique` ON `lp_fund_positions` (`lp_id`,`fund_id`);--> statement-breakpoint
CREATE TABLE `lps` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`entity_name` text,
	`email` text NOT NULL,
	`notes` text,
	`active` integer DEFAULT true NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `lps_email_unique` ON `lps` (`email`);--> statement-breakpoint
CREATE TABLE `magic_link_tokens` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`token_hash` text NOT NULL,
	`expires_at` integer NOT NULL,
	`used_at` integer,
	`created_at` integer NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE UNIQUE INDEX `magic_link_tokens_token_hash_unique` ON `magic_link_tokens` (`token_hash`);--> statement-breakpoint
CREATE TABLE `settings` (
	`key` text PRIMARY KEY NOT NULL,
	`value` text NOT NULL,
	`updated_at` integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE `update_sections` (
	`id` text PRIMARY KEY NOT NULL,
	`update_id` text NOT NULL,
	`company_id` text NOT NULL,
	`blurb` text NOT NULL,
	`sort_order` integer NOT NULL,
	FOREIGN KEY (`update_id`) REFERENCES `updates`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`company_id`) REFERENCES `companies`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `updates` (
	`id` text PRIMARY KEY NOT NULL,
	`fund_id` text NOT NULL,
	`title` text NOT NULL,
	`quarter` text NOT NULL,
	`status` text DEFAULT 'draft' NOT NULL,
	`published_at` integer,
	`intro_text` text,
	`closing_text` text,
	FOREIGN KEY (`fund_id`) REFERENCES `funds`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `users` (
	`id` text PRIMARY KEY NOT NULL,
	`email` text NOT NULL,
	`role` text NOT NULL,
	`lp_id` text,
	`active` integer DEFAULT true NOT NULL,
	`created_at` integer NOT NULL,
	FOREIGN KEY (`lp_id`) REFERENCES `lps`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE UNIQUE INDEX `users_email_unique` ON `users` (`email`);