"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.appRouter = void 0;
const trpc_1 = require("./trpc");
const hello_router_1 = require("./hello.router");
const ai_router_1 = require("./ai.router");
const config_router_1 = require("./config.router");
const feature_flags_router_1 = require("./feature-flags.router");
const projects_router_1 = require("./projects.router");
const runs_router_1 = require("./runs.router");
const nodes_router_1 = require("./nodes.router");
const workflows_router_1 = require("./workflows.router");
const tasks_router_1 = require("./tasks.router");
const logs_router_1 = require("./logs.router");
exports.appRouter = trpc_1.t.mergeRouters(hello_router_1.helloRouter, trpc_1.t.router({
    ai: ai_router_1.aiRouter,
    config: config_router_1.configRouter,
    featureFlags: feature_flags_router_1.featureFlagsRouter,
    projects: projects_router_1.projectsRouter,
    runs: runs_router_1.runsRouter,
    nodes: nodes_router_1.nodesRouter,
    workflows: workflows_router_1.workflowsRouter,
    tasks: tasks_router_1.tasksRouter,
    logs: logs_router_1.logsRouter,
}));
