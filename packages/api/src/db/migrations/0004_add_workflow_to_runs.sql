CREATE TABLE `run_step_results` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`run_id` integer NOT NULL,
	`step_id` integer NOT NULL,
	`node_id` integer NOT NULL,
	`position` integer NOT NULL,
	`status` text DEFAULT 'pending' NOT NULL,
	`input` text,
	`output` text,
	`started_at` text,
	`completed_at` text
);
--> statement-breakpoint
ALTER TABLE `pipeline_runs` ADD `workflow_id` integer;