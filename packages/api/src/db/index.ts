import { createClient } from '@libsql/client'
import { drizzle } from 'drizzle-orm/libsql'
import { join } from 'path'
import * as schema from './schema'

const DB_PATH = `file:${join(process.cwd(), 'data', 'pipenolinete.db')}`

const client = createClient({ url: DB_PATH })

export const db = drizzle(client, { schema })
export type Db = typeof db
