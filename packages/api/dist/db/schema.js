"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.runStepResults = exports.workflowSteps = exports.workflows = exports.aiNodes = exports.pipelineRuns = exports.featureFlags = exports.appConfig = void 0;
const sqlite_core_1 = require("drizzle-orm/sqlite-core");
const drizzle_orm_1 = require("drizzle-orm");
exports.appConfig = (0, sqlite_core_1.sqliteTable)('app_config', {
    key: (0, sqlite_core_1.text)('key').primaryKey(),
    value: (0, sqlite_core_1.text)('value').notNull().default(''),
    description: (0, sqlite_core_1.text)('description').notNull().default(''),
});
exports.featureFlags = (0, sqlite_core_1.sqliteTable)('feature_flags', {
    key: (0, sqlite_core_1.text)('key').primaryKey(),
    enabled: (0, sqlite_core_1.integer)('enabled', { mode: 'boolean' }).notNull().default(false),
    description: (0, sqlite_core_1.text)('description').notNull().default(''),
});
exports.pipelineRuns = (0, sqlite_core_1.sqliteTable)('pipeline_runs', {
    id: (0, sqlite_core_1.integer)('id').primaryKey({ autoIncrement: true }),
    projectName: (0, sqlite_core_1.text)('project_name').notNull(),
    projectPath: (0, sqlite_core_1.text)('project_path').notNull(),
    branch: (0, sqlite_core_1.text)('branch').notNull(),
    workflowId: (0, sqlite_core_1.integer)('workflow_id'),
    debugMode: (0, sqlite_core_1.integer)('debug_mode', { mode: 'boolean' }).notNull().default(false),
    status: (0, sqlite_core_1.text)('status').notNull().default('pending'),
    score: (0, sqlite_core_1.integer)('score'),
    issues: (0, sqlite_core_1.text)('issues'),
    summary: (0, sqlite_core_1.text)('summary'),
    startedAt: (0, sqlite_core_1.text)('started_at'),
    completedAt: (0, sqlite_core_1.text)('completed_at'),
    createdAt: (0, sqlite_core_1.text)('created_at').notNull().default((0, drizzle_orm_1.sql) `(strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))`),
});
exports.aiNodes = (0, sqlite_core_1.sqliteTable)('ai_nodes', {
    id: (0, sqlite_core_1.integer)('id').primaryKey({ autoIncrement: true }),
    name: (0, sqlite_core_1.text)('name').notNull(),
    description: (0, sqlite_core_1.text)('description').notNull().default(''),
    model: (0, sqlite_core_1.text)('model').notNull().default('gpt-4o'),
    systemPrompt: (0, sqlite_core_1.text)('system_prompt').notNull(),
    inputType: (0, sqlite_core_1.text)('input_type').notNull().default('text'),
    outputType: (0, sqlite_core_1.text)('output_type').notNull().default('text'),
    color: (0, sqlite_core_1.text)('color').notNull().default('#9ba8ff'),
    icon: (0, sqlite_core_1.text)('icon').notNull().default('smart_toy'),
    createdAt: (0, sqlite_core_1.text)('created_at').notNull().default((0, drizzle_orm_1.sql) `(strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))`),
});
exports.workflows = (0, sqlite_core_1.sqliteTable)('workflows', {
    id: (0, sqlite_core_1.integer)('id').primaryKey({ autoIncrement: true }),
    name: (0, sqlite_core_1.text)('name').notNull(),
    description: (0, sqlite_core_1.text)('description').notNull().default(''),
    createdAt: (0, sqlite_core_1.text)('created_at').notNull().default((0, drizzle_orm_1.sql) `(strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))`),
    updatedAt: (0, sqlite_core_1.text)('updated_at').notNull().default((0, drizzle_orm_1.sql) `(strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))`),
});
exports.workflowSteps = (0, sqlite_core_1.sqliteTable)('workflow_steps', {
    id: (0, sqlite_core_1.integer)('id').primaryKey({ autoIncrement: true }),
    workflowId: (0, sqlite_core_1.integer)('workflow_id').notNull(),
    nodeId: (0, sqlite_core_1.integer)('node_id').notNull(),
    position: (0, sqlite_core_1.integer)('position').notNull(),
    config: (0, sqlite_core_1.text)('config'),
});
exports.runStepResults = (0, sqlite_core_1.sqliteTable)('run_step_results', {
    id: (0, sqlite_core_1.integer)('id').primaryKey({ autoIncrement: true }),
    runId: (0, sqlite_core_1.integer)('run_id').notNull(),
    stepId: (0, sqlite_core_1.integer)('step_id').notNull(),
    nodeId: (0, sqlite_core_1.integer)('node_id').notNull(),
    position: (0, sqlite_core_1.integer)('position').notNull(),
    status: (0, sqlite_core_1.text)('status').notNull().default('pending'),
    input: (0, sqlite_core_1.text)('input'),
    output: (0, sqlite_core_1.text)('output'),
    startedAt: (0, sqlite_core_1.text)('started_at'),
    completedAt: (0, sqlite_core_1.text)('completed_at'),
});
