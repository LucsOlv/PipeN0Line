import { defineConfig } from 'drizzle-kit'
import { join } from 'path'

export default defineConfig({
  schema: './src/db/schema.ts',
  out: './src/db/migrations',
  dialect: 'turso',
  dbCredentials: {
    url: `file:${join(process.cwd(), 'data', 'pipenolinete.db')}`,
  },
})
