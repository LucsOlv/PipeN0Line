"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.aiRouter = void 0;
const zod_1 = require("zod");
const trpc_1 = require("./trpc");
exports.aiRouter = trpc_1.t.router({
    query: trpc_1.t.procedure
        .input(zod_1.z.object({
        prompt: zod_1.z.string().min(1),
        sessionId: zod_1.z.string().optional(),
        model: zod_1.z.string().optional(),
    }))
        .mutation(async ({ input, ctx }) => {
        return ctx.copilotService.query(input);
    }),
    listSessions: trpc_1.t.procedure.query(async ({ ctx }) => {
        return ctx.copilotService.listSessions();
    }),
});
