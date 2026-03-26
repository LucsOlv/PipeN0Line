"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.FeatureFlagsService = void 0;
const drizzle_orm_1 = require("drizzle-orm");
const schema_1 = require("../db/schema");
class FeatureFlagsService {
    db;
    constructor(db) {
        this.db = db;
    }
    async list() {
        return this.db.select().from(schema_1.featureFlags).all();
    }
    async get(key) {
        const rows = await this.db.select().from(schema_1.featureFlags).where((0, drizzle_orm_1.eq)(schema_1.featureFlags.key, key)).limit(1);
        return rows[0]?.enabled ?? false;
    }
    async set(key, enabled) {
        await this.db
            .insert(schema_1.featureFlags)
            .values({ key, enabled })
            .onConflictDoUpdate({ target: schema_1.featureFlags.key, set: { enabled } });
    }
}
exports.FeatureFlagsService = FeatureFlagsService;
