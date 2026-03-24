"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.helloRouter = void 0;
const trpc_1 = require("./trpc");
const zod_1 = require("zod");
exports.helloRouter = trpc_1.t.router({
    hello: trpc_1.t.procedure
        .input(zod_1.z.object({ name: zod_1.z.string().optional() }))
        .query(({ input }) => {
        return { message: `Hello, ${input.name ?? 'world'}!` };
    }),
});
