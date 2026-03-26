"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const fastify_plugin_1 = __importDefault(require("fastify-plugin"));
const db_1 = require("../db");
const seed_1 = require("../db/seed");
const config_service_1 = require("./config.service");
const feature_flags_service_1 = require("./feature-flags.service");
const runs_service_1 = require("../runs/runs.service");
async function configPlugin(server) {
    const configService = new config_service_1.ConfigService(db_1.db);
    const featureFlagsService = new feature_flags_service_1.FeatureFlagsService(db_1.db);
    const runsService = new runs_service_1.RunsService(db_1.db);
    server.decorate('configService', configService);
    server.decorate('featureFlagsService', featureFlagsService);
    server.decorate('runsService', runsService);
    server.addHook('onReady', async () => {
        await (0, seed_1.seedDefaults)();
    });
}
exports.default = (0, fastify_plugin_1.default)(configPlugin, { name: 'config-plugin' });
