CREATE TABLE `tasks` (
  `id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
  `name` text NOT NULL,
  `description` text NOT NULL DEFAULT '',
  `project_name` text NOT NULL,
  `project_path` text NOT NULL,
  `branch` text NOT NULL,
  `created_at` text NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
  `updated_at` text NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))
);--> statement-breakpoint
ALTER TABLE `pipeline_runs` ADD `task_id` integer;
