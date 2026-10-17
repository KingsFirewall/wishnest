CREATE TABLE `celebrations` (
	`id` text PRIMARY KEY NOT NULL,
	`owner` text NOT NULL,
	`slug` text NOT NULL,
	`title` text NOT NULL,
	`occasion` text NOT NULL,
	`date` text DEFAULT '' NOT NULL,
	`message` text DEFAULT '' NOT NULL,
	`currency` text DEFAULT 'USD' NOT NULL,
	`visibility` text DEFAULT 'unlisted' NOT NULL,
	`theme` text DEFAULT 'peach' NOT NULL,
	`created` integer NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `celebrations_slug_unique` ON `celebrations` (`slug`);--> statement-breakpoint
CREATE INDEX `celebrations_owner_idx` ON `celebrations` (`owner`);--> statement-breakpoint
CREATE TABLE `wishes` (
	`id` text PRIMARY KEY NOT NULL,
	`celebration_id` text NOT NULL,
	`title` text NOT NULL,
	`note` text DEFAULT '' NOT NULL,
	`kind` text DEFAULT 'product' NOT NULL,
	`category` text DEFAULT 'Other' NOT NULL,
	`price` integer,
	`url` text DEFAULT '' NOT NULL,
	`image` text DEFAULT '' NOT NULL,
	`priority` integer DEFAULT 0 NOT NULL,
	`art` text DEFAULT 'gift' NOT NULL,
	`position` integer DEFAULT 0 NOT NULL,
	`paused` integer DEFAULT 0 NOT NULL,
	`state` text DEFAULT 'available' NOT NULL,
	`token` text,
	`expires` integer,
	`extended` integer DEFAULT 0 NOT NULL,
	FOREIGN KEY (`celebration_id`) REFERENCES `celebrations`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE INDEX `wishes_celebration_idx` ON `wishes` (`celebration_id`);