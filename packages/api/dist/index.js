"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const fastify_1 = __importDefault(require("fastify"));
const cors_1 = __importDefault(require("@fastify/cors"));
const fastify_2 = require("@trpc/server/adapters/fastify");
const router_1 = require("./router");
const plugin_1 = __importDefault(require("./ai/plugin"));
const config_plugin_1 = __importDefault(require("./config/config.plugin"));
const server = (0, fastify_1.default)({ logger: true });
const start = async () => {
    await server.register(cors_1.default, { origin: true });
    await server.register(config_plugin_1.default);
    await server.register(plugin_1.default);
    await server.register(fastify_2.fastifyTRPCPlugin, {
        prefix: '/trpc',
        trpcOptions: {
            router: router_1.appRouter,
            createContext: () => ({
                copilotService: server.copilotService,
                configService: server.configService,
                featureFlagsService: server.featureFlagsService,
                runsService: server.runsService,
                nodesService: server.nodesService,
                workflowsService: server.workflowsService,
            }),
        },
    });
    await server.listen({ port: 3000, host: '0.0.0.0' });
};
start();
