"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.tasksRouter = void 0;
const zod_1 = require("zod");
const trpc_1 = require("./trpc");
exports.tasksRouter = trpc_1.t.router({
    list: trpc_1.t.procedure
        .input(zod_1.z.object({ projectPath: zod_1.z.string().optional() }))
        .query(async ({ ctx, input }) => {
        return ctx.tasksService.list(input.projectPath);
    }),
    get: trpc_1.t.procedure
        .input(zod_1.z.object({ id: zod_1.z.number() }))
        .query(async ({ ctx, input }) => {
        return ctx.tasksService.get(input.id);
    }),
    create: trpc_1.t.procedure
        .input(zod_1.z.object({
        name: zod_1.z.string().min(1),
        description: zod_1.z.string().optional(),
        projectName: zod_1.z.string().min(1),
        projectPath: zod_1.z.string().min(1),
        branch: zod_1.z.string().min(1),
    }))
        .mutation(async ({ ctx, input }) => {
        return ctx.tasksService.create(input);
    }),
    update: trpc_1.t.procedure
        .input(zod_1.z.object({
        id: zod_1.z.number(),
        name: zod_1.z.string().min(1).optional(),
        description: zod_1.z.string().optional(),
        branch: zod_1.z.string().min(1).optional(),
    }))
        .mutation(async ({ ctx, input }) => {
        const { id, ...data } = input;
        return ctx.tasksService.update(id, data);
    }),
    delete: trpc_1.t.procedure
        .input(zod_1.z.object({ id: zod_1.z.number() }))
        .mutation(async ({ ctx, input }) => {
        await ctx.tasksService.delete(input.id);
        return { success: true };
    }),
});
