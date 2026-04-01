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
    getStepResults: trpc_1.t.procedure
        .input(zod_1.z.object({ runId: zod_1.z.number() }))
        .query(async ({ ctx, input }) => {
        return ctx.runsService.getStepResults(input.runId);
    }),
    create: trpc_1.t.procedure
        .input(zod_1.z.object({
        taskId: zod_1.z.number(),
        workflowId: zod_1.z.number(),
        debugMode: zod_1.z.boolean().default(false),
    }))
        .mutation(async ({ ctx, input }) => {
        const task = await ctx.tasksService.get(input.taskId);
        if (!task)
            throw new Error('Task not found');
        const { id } = await ctx.runsService.create({
            taskId: task.id,
            projectName: task.projectName,
            projectPath: task.projectPath,
            branch: task.branch,
            workflowId: input.workflowId,
            debugMode: input.debugMode,
        });
        // fire-and-forget: execute workflow steps without blocking the response
        ctx.runsService.execute(id, ctx.copilotService, ctx.tasksService).catch((err) => {
            console.error(`[runs] execute failed for run ${id}:`, err);
        });
        return { id };
    }),
    cancel: trpc_1.t.procedure
        .input(zod_1.z.object({ id: zod_1.z.number() }))
        .mutation(async ({ ctx, input }) => {
        await ctx.runsService.cancel(input.id);
    }),
    delete: trpc_1.t.procedure
        .input(zod_1.z.object({ id: zod_1.z.number() }))
        .mutation(async ({ ctx, input }) => {
        await ctx.runsService.delete(input.id);
    }),
    skipStep: trpc_1.t.procedure
        .input(zod_1.z.object({ stepResultId: zod_1.z.number() }))
        .mutation(async ({ ctx, input }) => {
        await ctx.runsService.skipStep(input.stepResultId);
    }),
});
