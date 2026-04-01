"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const fastify_plugin_1 = __importDefault(require("fastify-plugin"));
const db_1 = require("../db");
const migrator_1 = require("drizzle-orm/libsql/migrator");
const path_1 = require("path");
const seed_1 = require("../db/seed");
const config_service_1 = require("./config.service");
const feature_flags_service_1 = require("./feature-flags.service");
const runs_service_1 = require("../runs/runs.service");
const nodes_service_1 = require("../nodes/nodes.service");
const workflows_service_1 = require("../workflows/workflows.service");
const tasks_service_1 = require("../tasks/tasks.service");
const logging_service_1 = require("../logging/logging.service");
async function configPlugin(server) {
    // Auto-apply pending migrations at startup
    try {
        await (0, migrator_1.migrate)(db_1.db, { migrationsFolder: (0, path_1.join)(process.cwd(), 'src/db/migrations') });
    }
    catch (err) {
        server.log.error({ err }, 'DB migration failed');
    }
    const loggingService = new logging_service_1.LoggingService(db_1.db);
    const configService = new config_service_1.ConfigService(db_1.db);
    const featureFlagsService = new feature_flags_service_1.FeatureFlagsService(db_1.db);
    const runsService = new runs_service_1.RunsService(db_1.db, loggingService);
    const nodesService = new nodes_service_1.NodesService(db_1.db);
    const workflowsService = new workflows_service_1.WorkflowsService(db_1.db);
    const tasksService = new tasks_service_1.TasksService(db_1.db);
    server.decorate('loggingService', loggingService);
    server.decorate('configService', configService);
    server.decorate('featureFlagsService', featureFlagsService);
    server.decorate('runsService', runsService);
    server.decorate('nodesService', nodesService);
    server.decorate('workflowsService', workflowsService);
    server.decorate('tasksService', tasksService);
    server.addHook('onReady', async () => {
        await (0, seed_1.seedDefaults)();
    });
}
exports.default = (0, fastify_plugin_1.default)(configPlugin, { name: 'config-plugin' });
