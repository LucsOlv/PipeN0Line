"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ConfigService = void 0;
const drizzle_orm_1 = require("drizzle-orm");
const schema_1 = require("../db/schema");
class ConfigService {
    db;
    constructor(db) {
        this.db = db;
    }
    async list() {
        return this.db.select().from(schema_1.appConfig).all();
    }
    async get(key) {
        const rows = await this.db.select().from(schema_1.appConfig).where((0, drizzle_orm_1.eq)(schema_1.appConfig.key, key)).limit(1);
        return rows[0]?.value ?? null;
    }
    async set(key, value) {
        await this.db
            .insert(schema_1.appConfig)
            .values({ key, value })
            .onConflictDoUpdate({ target: schema_1.appConfig.key, set: { value } });
    }
}
exports.ConfigService = ConfigService;
