CREATE TABLE `system_logs` (
  `id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
  `level` text NOT NULL DEFAULT 'info',
  `category` text NOT NULL DEFAULT 'system',
  `event` text NOT NULL,
  `run_id` integer,
  `step_result_id` integer,
  `message` text NOT NULL,
  `metadata` text,
  `created_at` text NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))
);
