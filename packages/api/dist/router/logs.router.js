"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.logsRouter = void 0;
const zod_1 = require("zod");
const trpc_1 = require("./trpc");
const LOG_LEVELS = ['debug', 'info', 'warn', 'error'];
const LOG_CATEGORIES = ['run', 'step', 'ai', 'binding', 'system'];
exports.logsRouter = trpc_1.t.router({
    list: trpc_1.t.procedure
        .input(zod_1.z.object({
        runId: zod_1.z.number().optional(),
        level: zod_1.z.enum(LOG_LEVELS).optional(),
        category: zod_1.z.enum(LOG_CATEGORIES).optional(),
        limit: zod_1.z.number().min(1).max(500).default(100),
        offset: zod_1.z.number().min(0).default(0),
    }))
        .query(async ({ ctx, input }) => {
        return ctx.loggingService.listLogs(input);
    }),
    getForRun: trpc_1.t.procedure
        .input(zod_1.z.object({ runId: zod_1.z.number() }))
        .query(async ({ ctx, input }) => {
        return ctx.loggingService.getForRun(input.runId);
    }),
});
