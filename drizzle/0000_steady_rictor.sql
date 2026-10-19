CREATE TABLE `analytics_events` (
	`id` text PRIMARY KEY NOT NULL,
	`visitor` text NOT NULL,
	`route` text NOT NULL,
	`created_at` integer NOT NULL
);
--> statement-breakpoint
CREATE INDEX `analytics_events_created_at` ON `analytics_events` (`created_at`);--> statement-breakpoint
CREATE INDEX `analytics_events_visitor_created_at` ON `analytics_events` (`visitor`,`created_at`);--> statement-breakpoint
CREATE TABLE `analytics_meta` (
	`id` integer PRIMARY KEY NOT NULL,
	`started_at` integer NOT NULL
);
