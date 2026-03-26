"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.nodesRouter = void 0;
const zod_1 = require("zod");
const trpc_1 = require("./trpc");
exports.nodesRouter = trpc_1.t.router({
    list: trpc_1.t.procedure.query(async ({ ctx }) => {
        return ctx.nodesService.list();
    }),
    get: trpc_1.t.procedure
        .input(zod_1.z.object({ id: zod_1.z.number() }))
        .query(async ({ ctx, input }) => {
        return ctx.nodesService.get(input.id);
    }),
    create: trpc_1.t.procedure
        .input(zod_1.z.object({
        name: zod_1.z.string().min(1),
        description: zod_1.z.string().optional(),
        model: zod_1.z.string().optional(),
        systemPrompt: zod_1.z.string().min(1),
        inputType: zod_1.z.enum(['text', 'json', 'code']).optional(),
        outputType: zod_1.z.enum(['text', 'json', 'code', 'score']).optional(),
        color: zod_1.z.string().optional(),
        icon: zod_1.z.string().optional(),
    }))
        .mutation(async ({ ctx, input }) => {
        return ctx.nodesService.create(input);
    }),
    update: trpc_1.t.procedure
        .input(zod_1.z.object({
        id: zod_1.z.number(),
        name: zod_1.z.string().min(1).optional(),
        description: zod_1.z.string().optional(),
        model: zod_1.z.string().optional(),
        systemPrompt: zod_1.z.string().min(1).optional(),
        inputType: zod_1.z.enum(['text', 'json', 'code']).optional(),
        outputType: zod_1.z.enum(['text', 'json', 'code', 'score']).optional(),
        color: zod_1.z.string().optional(),
        icon: zod_1.z.string().optional(),
    }))
        .mutation(async ({ ctx, input }) => {
        const { id, ...data } = input;
        return ctx.nodesService.update(id, data);
    }),
    delete: trpc_1.t.procedure
        .input(zod_1.z.object({ id: zod_1.z.number() }))
        .mutation(async ({ ctx, input }) => {
        await ctx.nodesService.delete(input.id);
        return { ok: true };
    }),
});
