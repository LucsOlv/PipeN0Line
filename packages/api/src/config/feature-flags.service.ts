import { eq } from 'drizzle-orm'
import type { Db } from '../db'
import { featureFlags } from '../db/schema'

export class FeatureFlagsService {
  constructor(private readonly db: Db) {}

  async list() {
    return this.db.select().from(featureFlags).all()
  }

  async get(key: string): Promise<boolean> {
    const rows = await this.db.select().from(featureFlags).where(eq(featureFlags.key, key)).limit(1)
    return rows[0]?.enabled ?? false
  }

  async set(key: string, enabled: boolean): Promise<void> {
    await this.db
      .insert(featureFlags)
      .values({ key, enabled })
      .onConflictDoUpdate({ target: featureFlags.key, set: { enabled } })
  }
}
