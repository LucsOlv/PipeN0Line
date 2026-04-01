"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.LoggingService = void 0;
const drizzle_orm_1 = require("drizzle-orm");
const schema_1 = require("../db/schema");
function truncate(value, maxLen) {
    if (!value)
        return '';
    return value.length > maxLen ? value.slice(0, maxLen) + `… [+${value.length - maxLen} chars]` : value;
}
class LoggingService {
    db;
    constructor(db) {
        this.db = db;
    }
    /** Fire-and-forget log writer. Never throws. */
    log(entry) {
        const metaStr = entry.metadata ? JSON.stringify(entry.metadata) : null;
        this.db
            .insert(schema_1.systemLogs)
            .values({
            level: entry.level ?? 'info',
            category: entry.category,
            event: entry.event,
            runId: entry.runId ?? null,
            stepResultId: entry.stepResultId ?? null,
            message: entry.message,
            metadata: metaStr,
            createdAt: new Date().toISOString(),
        })
            .catch((err) => {
            console.error('[LoggingService] Failed to write log:', err);
        });
    }
    async getForRun(runId) {
        try {
            return await this.db
                .select()
                .from(schema_1.systemLogs)
                .where((0, drizzle_orm_1.eq)(schema_1.systemLogs.runId, runId))
                .orderBy(schema_1.systemLogs.createdAt);
        }
        catch (err) {
            console.error('[LoggingService] getForRun failed:', err);
            return [];
        }
    }
    async listLogs(filter = {}) {
        try {
            const conditions = [];
            if (filter.runId !== undefined)
                conditions.push((0, drizzle_orm_1.eq)(schema_1.systemLogs.runId, filter.runId));
            if (filter.level)
                conditions.push((0, drizzle_orm_1.eq)(schema_1.systemLogs.level, filter.level));
            if (filter.category)
                conditions.push((0, drizzle_orm_1.eq)(schema_1.systemLogs.category, filter.category));
            const query = this.db
                .select()
                .from(schema_1.systemLogs)
                .orderBy((0, drizzle_orm_1.desc)(schema_1.systemLogs.createdAt))
                .limit(filter.limit ?? 100)
                .offset(filter.offset ?? 0);
            if (conditions.length > 0) {
                return await query.where((0, drizzle_orm_1.and)(...conditions));
            }
            return await query;
        }
        catch (err) {
            console.error('[LoggingService] listLogs failed:', err);
            return [];
        }
    }
    // ─── Convenience helpers ────────────────────────────────────────────────────
    logRunStarted(runId, meta) {
        this.log({
            level: 'info',
            category: 'run',
            event: 'run.started',
            runId,
            message: `Run #${runId} started`,
            metadata: meta,
        });
    }
    logRunCompleted(runId, meta) {
        this.log({
            level: 'info',
            category: 'run',
            event: 'run.completed',
            runId,
            message: `Run #${runId} completed in ${meta.durationMs}ms`,
            metadata: meta,
        });
    }
    logRunFailed(runId, error) {
        this.log({
            level: 'error',
            category: 'run',
            event: 'run.failed',
            runId,
            message: `Run #${runId} failed: ${error}`,
            metadata: { error },
        });
    }
    logStepStarted(runId, stepResultId, meta) {
        this.log({
            level: 'info',
            category: 'step',
            event: 'step.started',
            runId,
            stepResultId,
            message: `Step #${meta.position + 1} "${meta.nodeName}" started`,
            metadata: meta,
        });
    }
    logStepInputResolved(runId, stepResultId, input, position) {
        this.log({
            level: 'debug',
            category: 'step',
            event: 'step.input_resolved',
            runId,
            stepResultId,
            message: `Step #${position + 1} input resolved (${input.length} chars)`,
            metadata: { inputPreview: truncate(input, 2000), totalChars: input.length },
        });
    }
    logStepCompleted(runId, stepResultId, output, position) {
        this.log({
            level: 'info',
            category: 'step',
            event: 'step.completed',
            runId,
            stepResultId,
            message: `Step #${position + 1} completed (${output.length} chars output)`,
            metadata: { outputPreview: truncate(output, 2000), totalChars: output.length },
        });
    }
    logStepFailed(runId, stepResultId, error, position, nodeName) {
        this.log({
            level: 'error',
            category: 'step',
            event: 'step.failed',
            runId,
            stepResultId,
            message: `Step #${position + 1} "${nodeName}" failed: ${error}`,
            metadata: { error },
        });
    }
    logBindingResolved(runId, stepResultId, portKey, source, field, position) {
        this.log({
            level: 'debug',
            category: 'binding',
            event: 'binding.resolved',
            runId,
            stepResultId,
            message: `Step #${position + 1} binding "${portKey}" ← ${source}:${field}`,
            metadata: { portKey, source, field, position },
        });
    }
    logAiRequest(runId, stepResultId, model, prompt) {
        this.log({
            level: 'info',
            category: 'ai',
            event: 'ai.request',
            runId,
            stepResultId,
            message: `AI request sent (model: ${model}, ${prompt.length} chars)`,
            metadata: { model, promptPreview: truncate(prompt, 3000), totalChars: prompt.length },
        });
    }
    logAiResponse(runId, stepResultId, content, durationMs) {
        this.log({
            level: 'info',
            category: 'ai',
            event: 'ai.response',
            runId,
            stepResultId,
            message: `AI response received (${content.length} chars, ${durationMs}ms)`,
            metadata: { contentPreview: truncate(content, 3000), totalChars: content.length, durationMs },
        });
    }
    logAiError(runId, stepResultId, error, model) {
        this.log({
            level: 'error',
            category: 'ai',
            event: 'ai.error',
            runId,
            stepResultId,
            message: `AI request failed (model: ${model}): ${error}`,
            metadata: { error, model },
        });
    }
}
exports.LoggingService = LoggingService;
