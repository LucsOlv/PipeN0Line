import { sqliteTable, text, integer } from 'drizzle-orm/sqlite-core'
import { sql } from 'drizzle-orm'

export const appConfig = sqliteTable('app_config', {
  key: text('key').primaryKey(),
  value: text('value').notNull().default(''),
  description: text('description').notNull().default(''),
})

export const featureFlags = sqliteTable('feature_flags', {
  key: text('key').primaryKey(),
  enabled: integer('enabled', { mode: 'boolean' }).notNull().default(false),
  description: text('description').notNull().default(''),
})

export const pipelineRuns = sqliteTable('pipeline_runs', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  projectName: text('project_name').notNull(),
  projectPath: text('project_path').notNull(),
  branch: text('branch').notNull(),
  debugMode: integer('debug_mode', { mode: 'boolean' }).notNull().default(false),
  status: text('status').notNull().default('pending'),
  score: integer('score'),
  issues: text('issues'),
  summary: text('summary'),
  startedAt: text('started_at'),
  completedAt: text('completed_at'),
  createdAt: text('created_at').notNull().default(sql`(strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))`),
})

export const aiNodes = sqliteTable('ai_nodes', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  name: text('name').notNull(),
  description: text('description').notNull().default(''),
  model: text('model').notNull().default('gpt-4o'),
  systemPrompt: text('system_prompt').notNull(),
  inputType: text('input_type').notNull().default('text'),
  outputType: text('output_type').notNull().default('text'),
  color: text('color').notNull().default('#9ba8ff'),
  icon: text('icon').notNull().default('smart_toy'),
  createdAt: text('created_at').notNull().default(sql`(strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))`),
})

export const workflows = sqliteTable('workflows', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  name: text('name').notNull(),
  description: text('description').notNull().default(''),
  createdAt: text('created_at').notNull().default(sql`(strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))`),
  updatedAt: text('updated_at').notNull().default(sql`(strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))`),
})

export const workflowSteps = sqliteTable('workflow_steps', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  workflowId: integer('workflow_id').notNull(),
  nodeId: integer('node_id').notNull(),
  position: integer('position').notNull(),
  config: text('config'),
})
