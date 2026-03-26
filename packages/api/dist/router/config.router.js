"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.configRouter = void 0;
const zod_1 = require("zod");
const trpc_1 = require("./trpc");
exports.configRouter = trpc_1.t.router({
    list: trpc_1.t.procedure.query(async ({ ctx }) => {
        return ctx.configService.list();
    }),
    get: trpc_1.t.procedure
        .input(zod_1.z.object({ key: zod_1.z.string() }))
        .query(async ({ ctx, input }) => {
        const value = await ctx.configService.get(input.key);
        return { value };
    }),
    set: trpc_1.t.procedure
        .input(zod_1.z.object({ key: zod_1.z.string(), value: zod_1.z.string() }))
        .mutation(async ({ ctx, input }) => {
        await ctx.configService.set(input.key, input.value);
        return { ok: true };
    }),
});
