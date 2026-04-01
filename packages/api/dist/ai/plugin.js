"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const fastify_plugin_1 = __importDefault(require("fastify-plugin"));
const client_1 = require("./client");
const service_1 = require("./service");
const logging_copilot_proxy_1 = require("./logging-copilot.proxy");
async function copilotPlugin(server) {
    await (0, client_1.startCopilotClient)();
    const bare = new service_1.CopilotService((0, client_1.getCopilotClient)());
    const service = server.loggingService
        ? new logging_copilot_proxy_1.LoggingCopilotProxy(bare, server.loggingService)
        : bare;
    server.decorate('copilotService', service);
    server.addHook('onClose', async () => {
        await (0, client_1.stopCopilotClient)();
    });
}
exports.default = (0, fastify_plugin_1.default)(copilotPlugin, {
    name: 'copilot',
    fastify: '5.x',
    dependencies: ['config-plugin'],
});
