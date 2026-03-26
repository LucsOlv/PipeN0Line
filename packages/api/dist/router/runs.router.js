"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.runsRouter = void 0;
const zod_1 = require("zod");
const trpc_1 = require("./trpc");
exports.runsRouter = trpc_1.t.router({
    list: trpc_1.t.procedure.query(async ({ ctx }) => {
        return ctx.runsService.list();
    }),
    get: trpc_1.t.procedure
        .input(zod_1.z.object({ id: zod_1.z.number() }))
        .query(async ({ ctx, input }) => {
        return ctx.runsService.get(input.id);
    }),
    create: trpc_1.t.procedure
        .input(zod_1.z.object({
        projectName: zod_1.z.string().min(1),
        projectPath: zod_1.z.string().min(1),
        branch: zod_1.z.string().min(1),
        debugMode: zod_1.z.boolean().default(false),
    }))
        .mutation(async ({ ctx, input }) => {
        const { id } = await ctx.runsService.create(input);
        // fire-and-forget: execute AI analysis without blocking the response
        ctx.runsService.execute(id, ctx.copilotService).catch((err) => {
            console.error(`[runs] execute failed for run ${id}:`, err);
        });
        return { id };
    }),
});
