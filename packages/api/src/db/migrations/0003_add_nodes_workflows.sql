CREATE TABLE `ai_nodes` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`name` text NOT NULL,
	`description` text DEFAULT '' NOT NULL,
	`model` text DEFAULT 'gpt-4o' NOT NULL,
	`system_prompt` text NOT NULL,
	`input_type` text DEFAULT 'text' NOT NULL,
	`output_type` text DEFAULT 'text' NOT NULL,
	`color` text DEFAULT '#9ba8ff' NOT NULL,
	`icon` text DEFAULT 'smart_toy' NOT NULL,
	`created_at` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL
);
--> statement-breakpoint
CREATE TABLE `workflow_steps` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`workflow_id` integer NOT NULL,
	`node_id` integer NOT NULL,
	`position` integer NOT NULL,
	`config` text
);
--> statement-breakpoint
CREATE TABLE `workflows` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`name` text NOT NULL,
	`description` text DEFAULT '' NOT NULL,
	`created_at` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL,
	`updated_at` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL
);
