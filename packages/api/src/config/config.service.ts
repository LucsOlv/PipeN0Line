import { eq } from 'drizzle-orm'
import type { Db } from '../db'
import { appConfig } from '../db/schema'

export class ConfigService {
  constructor(private readonly db: Db) {}

  async list() {
    return this.db.select().from(appConfig).all()
  }

  async get(key: string): Promise<string | null> {
    const rows = await this.db.select().from(appConfig).where(eq(appConfig.key, key)).limit(1)
    return rows[0]?.value ?? null
  }

  async set(key: string, value: string): Promise<void> {
    await this.db
      .insert(appConfig)
      .values({ key, value })
      .onConflictDoUpdate({ target: appConfig.key, set: { value } })
  }
}
