"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.appRouter = void 0;
const trpc_1 = require("./trpc");
const hello_router_1 = require("./hello.router");
const ai_router_1 = require("./ai.router");
exports.appRouter = trpc_1.t.mergeRouters(hello_router_1.helloRouter, trpc_1.t.router({ ai: ai_router_1.aiRouter }));
