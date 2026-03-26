"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.featureFlagsRouter = void 0;
const zod_1 = require("zod");
const trpc_1 = require("./trpc");
exports.featureFlagsRouter = trpc_1.t.router({
    list: trpc_1.t.procedure.query(async ({ ctx }) => {
        return ctx.featureFlagsService.list();
    }),
    set: trpc_1.t.procedure
        .input(zod_1.z.object({ key: zod_1.z.string(), enabled: zod_1.z.boolean() }))
        .mutation(async ({ ctx, input }) => {
        await ctx.featureFlagsService.set(input.key, input.enabled);
        return { ok: true };
    }),
});
