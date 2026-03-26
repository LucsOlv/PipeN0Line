"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.NodesService = void 0;
const drizzle_orm_1 = require("drizzle-orm");
const schema_1 = require("../db/schema");
class NodesService {
    db;
    constructor(db) {
        this.db = db;
    }
    async list() {
        return this.db.select().from(schema_1.aiNodes).orderBy((0, drizzle_orm_1.desc)(schema_1.aiNodes.createdAt));
    }
    async get(id) {
        const rows = await this.db.select().from(schema_1.aiNodes).where((0, drizzle_orm_1.eq)(schema_1.aiNodes.id, id)).limit(1);
        return rows[0] ?? null;
    }
    async create(input) {
        const result = await this.db
            .insert(schema_1.aiNodes)
            .values({
            name: input.name,
            description: input.description ?? '',
            model: input.model ?? 'gpt-4o',
            systemPrompt: input.systemPrompt,
            inputType: input.inputType ?? 'text',
            outputType: input.outputType ?? 'text',
            color: input.color ?? '#9ba8ff',
            icon: input.icon ?? 'smart_toy',
        })
            .returning();
        return result[0];
    }
    async update(id, input) {
        const sets = {};
        if (input.name !== undefined)
            sets.name = input.name;
        if (input.description !== undefined)
            sets.description = input.description;
        if (input.model !== undefined)
            sets.model = input.model;
        if (input.systemPrompt !== undefined)
            sets.systemPrompt = input.systemPrompt;
        if (input.inputType !== undefined)
            sets.inputType = input.inputType;
        if (input.outputType !== undefined)
            sets.outputType = input.outputType;
        if (input.color !== undefined)
            sets.color = input.color;
        if (input.icon !== undefined)
            sets.icon = input.icon;
        if (Object.keys(sets).length === 0)
            return this.get(id);
        await this.db.update(schema_1.aiNodes).set(sets).where((0, drizzle_orm_1.eq)(schema_1.aiNodes.id, id));
        return this.get(id);
    }
    async delete(id) {
        await this.db.delete(schema_1.aiNodes).where((0, drizzle_orm_1.eq)(schema_1.aiNodes.id, id));
    }
}
exports.NodesService = NodesService;
