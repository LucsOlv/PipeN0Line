"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.WorkflowsService = void 0;
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
class WorkflowsService {
    db;
    constructor(db) {
        this.db = db;
    }
    async list() {
        const allWorkflows = await this.db.select().from(schema_1.workflows).orderBy((0, drizzle_orm_1.desc)(schema_1.workflows.createdAt));
        const allSteps = await this.db.select().from(schema_1.workflowSteps).orderBy((0, drizzle_orm_1.asc)(schema_1.workflowSteps.position));
        return allWorkflows.map((w) => ({
            ...w,
            stepCount: allSteps.filter((s) => s.workflowId === w.id).length,
        }));
    }
    async get(id) {
        const rows = await this.db.select().from(schema_1.workflows).where((0, drizzle_orm_1.eq)(schema_1.workflows.id, id)).limit(1);
        const workflow = rows[0] ?? null;
        if (!workflow)
            return null;
        const steps = await this.db
            .select({
            id: schema_1.workflowSteps.id,
            workflowId: schema_1.workflowSteps.workflowId,
            nodeId: schema_1.workflowSteps.nodeId,
            position: schema_1.workflowSteps.position,
            config: schema_1.workflowSteps.config,
            node: {
                id: schema_1.aiNodes.id,
                name: schema_1.aiNodes.name,
                description: schema_1.aiNodes.description,
                model: schema_1.aiNodes.model,
                systemPrompt: schema_1.aiNodes.systemPrompt,
                inputType: schema_1.aiNodes.inputType,
                outputType: schema_1.aiNodes.outputType,
                inputPorts: schema_1.aiNodes.inputPorts,
                outputPorts: schema_1.aiNodes.outputPorts,
                color: schema_1.aiNodes.color,
                icon: schema_1.aiNodes.icon,
            },
        })
            .from(schema_1.workflowSteps)
            .innerJoin(schema_1.aiNodes, (0, drizzle_orm_1.eq)(schema_1.workflowSteps.nodeId, schema_1.aiNodes.id))
            .where((0, drizzle_orm_1.eq)(schema_1.workflowSteps.workflowId, id))
            .orderBy((0, drizzle_orm_1.asc)(schema_1.workflowSteps.position));
        const enrichedSteps = steps.map((s) => ({
            ...s,
            config: s.config ? JSON.parse(s.config) : null,
            node: {
                ...s.node,
                inputPorts: parsePortsJson(s.node.inputPorts, io_ports_1.DEFAULT_INPUT_PORTS),
                outputPorts: parsePortsJson(s.node.outputPorts, io_ports_1.DEFAULT_OUTPUT_PORTS),
            },
        }));
        return { ...workflow, steps: enrichedSteps };
    }
    async create(input) {
        const now = new Date().toISOString();
        const result = await this.db
            .insert(schema_1.workflows)
            .values({
            name: input.name,
            description: input.description ?? '',
            createdAt: now,
            updatedAt: now,
        })
            .returning();
        return result[0];
    }
    async update(id, input) {
        const sets = { updatedAt: new Date().toISOString() };
        if (input.name !== undefined)
            sets.name = input.name;
        if (input.description !== undefined)
            sets.description = input.description;
        await this.db.update(schema_1.workflows).set(sets).where((0, drizzle_orm_1.eq)(schema_1.workflows.id, id));
        return this.get(id);
    }
    async delete(id) {
        await this.db.delete(schema_1.workflowSteps).where((0, drizzle_orm_1.eq)(schema_1.workflowSteps.workflowId, id));
        await this.db.delete(schema_1.workflows).where((0, drizzle_orm_1.eq)(schema_1.workflows.id, id));
    }
    async addStep(workflowId, nodeId, position) {
        const existingSteps = await this.db
            .select()
            .from(schema_1.workflowSteps)
            .where((0, drizzle_orm_1.eq)(schema_1.workflowSteps.workflowId, workflowId))
            .orderBy((0, drizzle_orm_1.asc)(schema_1.workflowSteps.position));
        const pos = position ?? existingSteps.length;
        // shift steps at or after the target position
        for (const step of existingSteps) {
            if (step.position >= pos) {
                await this.db
                    .update(schema_1.workflowSteps)
                    .set({ position: step.position + 1 })
                    .where((0, drizzle_orm_1.eq)(schema_1.workflowSteps.id, step.id));
            }
        }
        const result = await this.db
            .insert(schema_1.workflowSteps)
            .values({ workflowId, nodeId, position: pos })
            .returning();
        await this.db
            .update(schema_1.workflows)
            .set({ updatedAt: new Date().toISOString() })
            .where((0, drizzle_orm_1.eq)(schema_1.workflows.id, workflowId));
        return result[0];
    }
    async removeStep(stepId) {
        const rows = await this.db.select().from(schema_1.workflowSteps).where((0, drizzle_orm_1.eq)(schema_1.workflowSteps.id, stepId)).limit(1);
        const step = rows[0];
        if (!step)
            return;
        await this.db.delete(schema_1.workflowSteps).where((0, drizzle_orm_1.eq)(schema_1.workflowSteps.id, stepId));
        // re-compact positions
        const remaining = await this.db
            .select()
            .from(schema_1.workflowSteps)
            .where((0, drizzle_orm_1.eq)(schema_1.workflowSteps.workflowId, step.workflowId))
            .orderBy((0, drizzle_orm_1.asc)(schema_1.workflowSteps.position));
        for (let i = 0; i < remaining.length; i++) {
            if (remaining[i].position !== i) {
                await this.db
                    .update(schema_1.workflowSteps)
                    .set({ position: i })
                    .where((0, drizzle_orm_1.eq)(schema_1.workflowSteps.id, remaining[i].id));
            }
        }
        await this.db
            .update(schema_1.workflows)
            .set({ updatedAt: new Date().toISOString() })
            .where((0, drizzle_orm_1.eq)(schema_1.workflows.id, step.workflowId));
    }
    async reorderSteps(workflowId, stepIds) {
        for (let i = 0; i < stepIds.length; i++) {
            await this.db
                .update(schema_1.workflowSteps)
                .set({ position: i })
                .where((0, drizzle_orm_1.eq)(schema_1.workflowSteps.id, stepIds[i]));
        }
        await this.db
            .update(schema_1.workflows)
            .set({ updatedAt: new Date().toISOString() })
            .where((0, drizzle_orm_1.eq)(schema_1.workflows.id, workflowId));
    }
    async updateStepConfig(stepId, config) {
        const rows = await this.db.select().from(schema_1.workflowSteps).where((0, drizzle_orm_1.eq)(schema_1.workflowSteps.id, stepId)).limit(1);
        const step = rows[0];
        if (!step)
            return null;
        await this.db
            .update(schema_1.workflowSteps)
            .set({ config: JSON.stringify(config) })
            .where((0, drizzle_orm_1.eq)(schema_1.workflowSteps.id, stepId));
        await this.db
            .update(schema_1.workflows)
            .set({ updatedAt: new Date().toISOString() })
            .where((0, drizzle_orm_1.eq)(schema_1.workflows.id, step.workflowId));
        return this.get(step.workflowId);
    }
}
exports.WorkflowsService = WorkflowsService;
