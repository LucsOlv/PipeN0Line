"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.NodesService = void 0;
const drizzle_orm_1 = require("drizzle-orm");
const schema_1 = require("../db/schema");
const io_ports_1 = require("../types/io-ports");
function parsePortsJson(json, fallback) {
    if (!json || json === '[]')
        return fallback;
    try {
        const parsed = JSON.parse(json);
        return Array.isArray(parsed) && parsed.length > 0 ? parsed : fallback;
    }
    catch {
        return fallback;
    }
}
function enrichNode(row) {
    return {
        ...row,
        inputPorts: parsePortsJson(row.inputPorts, io_ports_1.DEFAULT_INPUT_PORTS),
        outputPorts: parsePortsJson(row.outputPorts, io_ports_1.DEFAULT_OUTPUT_PORTS),
    };
}
class NodesService {
    db;
    constructor(db) {
        this.db = db;
    }
    async list() {
        const rows = await this.db.select().from(schema_1.aiNodes).orderBy((0, drizzle_orm_1.desc)(schema_1.aiNodes.createdAt));
        return rows.map(enrichNode);
    }
    async get(id) {
        const rows = await this.db.select().from(schema_1.aiNodes).where((0, drizzle_orm_1.eq)(schema_1.aiNodes.id, id)).limit(1);
        if (!rows[0])
            return null;
        return enrichNode(rows[0]);
    }
    async create(input) {
        const inputPorts = input.inputPorts ?? io_ports_1.DEFAULT_INPUT_PORTS;
        const outputPorts = input.outputPorts ?? io_ports_1.DEFAULT_OUTPUT_PORTS;
        const result = await this.db
            .insert(schema_1.aiNodes)
            .values({
            name: input.name,
            description: input.description ?? '',
            model: input.model ?? 'gpt-4o',
            systemPrompt: input.systemPrompt,
            inputType: input.inputType ?? 'text',
            outputType: input.outputType ?? 'text',
            inputPorts: JSON.stringify(inputPorts),
            outputPorts: JSON.stringify(outputPorts),
            color: input.color ?? '#9ba8ff',
            icon: input.icon ?? 'smart_toy',
        })
            .returning();
        return enrichNode(result[0]);
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
        if (input.inputPorts !== undefined)
            sets.inputPorts = JSON.stringify(input.inputPorts);
        if (input.outputPorts !== undefined)
            sets.outputPorts = JSON.stringify(input.outputPorts);
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
