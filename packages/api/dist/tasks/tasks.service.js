"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.TasksService = void 0;
const drizzle_orm_1 = require("drizzle-orm");
const schema_1 = require("../db/schema");
class TasksService {
    db;
    constructor(db) {
        this.db = db;
    }
    async list(projectPath) {
        const query = this.db.select().from(schema_1.tasks).orderBy((0, drizzle_orm_1.desc)(schema_1.tasks.createdAt));
        if (projectPath) {
            return query.where((0, drizzle_orm_1.eq)(schema_1.tasks.projectPath, projectPath));
        }
        return query;
    }
    async get(id) {
        const rows = await this.db.select().from(schema_1.tasks).where((0, drizzle_orm_1.eq)(schema_1.tasks.id, id)).limit(1);
        return rows[0] ?? null;
    }
    async create(input) {
        const now = new Date().toISOString();
        const result = await this.db
            .insert(schema_1.tasks)
            .values({
            name: input.name,
            description: input.description ?? '',
            projectName: input.projectName,
            projectPath: input.projectPath,
            branch: input.branch,
            createdAt: now,
            updatedAt: now,
        })
            .returning({ id: schema_1.tasks.id });
        return result[0];
    }
    async update(id, input) {
        const setClauses = {
            updatedAt: new Date().toISOString(),
        };
        if (input.name !== undefined)
            setClauses.name = input.name;
        if (input.description !== undefined)
            setClauses.description = input.description;
        if (input.branch !== undefined)
            setClauses.branch = input.branch;
        await this.db.update(schema_1.tasks).set(setClauses).where((0, drizzle_orm_1.eq)(schema_1.tasks.id, id));
        return this.get(id);
    }
    async delete(id) {
        await this.db.delete(schema_1.tasks).where((0, drizzle_orm_1.eq)(schema_1.tasks.id, id));
    }
}
exports.TasksService = TasksService;
