CREATE TABLE `app_config` (
	`key` text PRIMARY KEY NOT NULL,
	`value` text DEFAULT '' NOT NULL,
	`description` text DEFAULT '' NOT NULL
);
--> statement-breakpoint
CREATE TABLE `feature_flags` (
	`key` text PRIMARY KEY NOT NULL,
	`enabled` integer DEFAULT false NOT NULL,
	`description` text DEFAULT '' NOT NULL
);
