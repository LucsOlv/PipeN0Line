import { sqliteTable, text, integer } from 'drizzle-orm/sqlite-core'

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
