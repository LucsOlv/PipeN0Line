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

export const systemLogs = sqliteTable('system_logs', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  level: text('level').notNull().default('info'),
  category: text('category').notNull().default('system'),
  event: text('event').notNull(),
  runId: integer('run_id'),
  stepResultId: integer('step_result_id'),
  message: text('message').notNull(),
  metadata: text('metadata'),
  createdAt: text('created_at').notNull().default(sql`(strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))`),
})

export const tasks = sqliteTable('tasks', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  name: text('name').notNull(),
  description: text('description').notNull().default(''),
  projectName: text('project_name').notNull(),
  projectPath: text('project_path').notNull(),
  branch: text('branch').notNull(),
  createdAt: text('created_at').notNull().default(sql`(strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))`),
  updatedAt: text('updated_at').notNull().default(sql`(strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))`),
})

export const pipelineRuns = sqliteTable('pipeline_runs', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  taskId: integer('task_id'),
  projectName: text('project_name').notNull(),
  projectPath: text('project_path').notNull(),
  branch: text('branch').notNull(),
  workflowId: integer('workflow_id'),
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
  inputPorts: text('input_ports').notNull().default('[]'),
  outputPorts: text('output_ports').notNull().default('[]'),
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

export const runStepResults = sqliteTable('run_step_results', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  runId: integer('run_id').notNull(),
  stepId: integer('step_id').notNull(),
  nodeId: integer('node_id').notNull(),
  position: integer('position').notNull(),
  status: text('status').notNull().default('pending'),
  input: text('input'),
  output: text('output'),
  startedAt: text('started_at'),
  completedAt: text('completed_at'),
})
