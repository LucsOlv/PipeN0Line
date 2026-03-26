"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.workflowsRouter = void 0;
const zod_1 = require("zod");
const trpc_1 = require("./trpc");
exports.workflowsRouter = trpc_1.t.router({
    list: trpc_1.t.procedure.query(async ({ ctx }) => {
        return ctx.workflowsService.list();
    }),
    get: trpc_1.t.procedure
        .input(zod_1.z.object({ id: zod_1.z.number() }))
        .query(async ({ ctx, input }) => {
        return ctx.workflowsService.get(input.id);
    }),
    create: trpc_1.t.procedure
        .input(zod_1.z.object({
        name: zod_1.z.string().min(1),
        description: zod_1.z.string().optional(),
    }))
        .mutation(async ({ ctx, input }) => {
        return ctx.workflowsService.create(input);
    }),
    update: trpc_1.t.procedure
        .input(zod_1.z.object({
        id: zod_1.z.number(),
        name: zod_1.z.string().min(1).optional(),
        description: zod_1.z.string().optional(),
    }))
        .mutation(async ({ ctx, input }) => {
        const { id, ...data } = input;
        return ctx.workflowsService.update(id, data);
    }),
    delete: trpc_1.t.procedure
        .input(zod_1.z.object({ id: zod_1.z.number() }))
        .mutation(async ({ ctx, input }) => {
        await ctx.workflowsService.delete(input.id);
        return { ok: true };
    }),
    addStep: trpc_1.t.procedure
        .input(zod_1.z.object({
        workflowId: zod_1.z.number(),
        nodeId: zod_1.z.number(),
        position: zod_1.z.number().optional(),
    }))
        .mutation(async ({ ctx, input }) => {
        return ctx.workflowsService.addStep(input.workflowId, input.nodeId, input.position);
    }),
    removeStep: trpc_1.t.procedure
        .input(zod_1.z.object({ stepId: zod_1.z.number() }))
        .mutation(async ({ ctx, input }) => {
        await ctx.workflowsService.removeStep(input.stepId);
        return { ok: true };
    }),
    reorderSteps: trpc_1.t.procedure
        .input(zod_1.z.object({
        workflowId: zod_1.z.number(),
        stepIds: zod_1.z.array(zod_1.z.number()),
    }))
        .mutation(async ({ ctx, input }) => {
        await ctx.workflowsService.reorderSteps(input.workflowId, input.stepIds);
        return { ok: true };
    }),
});
