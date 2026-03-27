"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.RunsService = void 0;
const fs_1 = require("fs");
const path_1 = require("path");
const drizzle_orm_1 = require("drizzle-orm");
const schema_1 = require("../db/schema");
const IGNORED_DIRS = new Set([
    'node_modules', '.git', 'dist', 'build', '.next', '.nuxt',
    'coverage', '.cache', '.turbo', 'out', '.output',
]);
const IGNORED_EXTENSIONS = new Set([
    '.lock', '.log', '.png', '.jpg', '.jpeg', '.gif', '.svg', '.ico',
    '.woff', '.woff2', '.ttf', '.eot', '.mp4', '.mp3', '.zip', '.tar',
    '.gz', '.db', '.sqlite', '.bin', '.exe',
]);
const MAX_FILES = 50;
const MAX_TOTAL_BYTES = 100 * 1024;
function collectFiles(dir, rootDir, collected, bytesRef) {
    if (collected.length >= MAX_FILES || bytesRef.total >= MAX_TOTAL_BYTES)
        return;
    let entries;
    try {
        entries = (0, fs_1.readdirSync)(dir);
    }
    catch {
        return;
    }
    for (const name of entries) {
        if (collected.length >= MAX_FILES || bytesRef.total >= MAX_TOTAL_BYTES)
            break;
        if (name.startsWith('.') && name !== '.env.example')
            continue;
        const fullPath = (0, path_1.join)(dir, name);
        let stat;
        try {
            stat = (0, fs_1.statSync)(fullPath);
        }
        catch {
            continue;
        }
        if (stat.isDirectory()) {
            if (!IGNORED_DIRS.has(name))
                collectFiles(fullPath, rootDir, collected, bytesRef);
        }
        else if (stat.isFile()) {
            if (IGNORED_EXTENSIONS.has((0, path_1.extname)(name).toLowerCase()))
                continue;
            if (stat.size > 30 * 1024)
                continue;
            try {
                const content = (0, fs_1.readFileSync)(fullPath, 'utf-8');
                bytesRef.total += content.length;
                if (bytesRef.total > MAX_TOTAL_BYTES)
                    break;
                collected.push({ path: (0, path_1.relative)(rootDir, fullPath), content });
            }
            catch {
                // skip unreadable files
            }
        }
    }
}
function buildProjectContext(projectName, branch, files) {
    const fileBlock = files
        .map((f) => `### ${f.path}\n\`\`\`\n${f.content}\n\`\`\``)
        .join('\n\n');
    return `Project: "${projectName}" (branch: ${branch})\n\n--- CODEBASE ---\n\n${fileBlock}`;
}
function parseStepConfig(config) {
    if (!config)
        return { bindings: {} };
    try {
        const parsed = JSON.parse(config);
        return { bindings: parsed.bindings ?? {} };
    }
    catch {
        return { bindings: {} };
    }
}
function resolveBindings(config, taskData, stepOutputs, currentPosition, fallbackInput) {
    const bindings = config.bindings;
    const bindingKeys = Object.keys(bindings);
    // No bindings configured → fallback: previous step output or project context
    if (bindingKeys.length === 0) {
        if (currentPosition === 0)
            return fallbackInput;
        const prev = stepOutputs.get(currentPosition - 1);
        return prev ?? fallbackInput;
    }
    // Resolve each binding and compose input sections
    const sections = [];
    for (const [portKey, binding] of Object.entries(bindings)) {
        const value = resolveBinding(binding, taskData, stepOutputs);
        if (value) {
            sections.push(`[${portKey}]\n${value}`);
        }
    }
    return sections.length > 0 ? sections.join('\n\n') : fallbackInput;
}
function resolveBinding(binding, taskData, stepOutputs) {
    if (binding.source === 'task') {
        return taskData[binding.field] ?? null;
    }
    if (binding.source === 'step' && binding.stepPosition !== undefined) {
        return stepOutputs.get(binding.stepPosition) ?? null;
    }
    return null;
}
class RunsService {
    db;
    constructor(db) {
        this.db = db;
    }
    async create(input) {
        const result = await this.db
            .insert(schema_1.pipelineRuns)
            .values({
            projectName: input.projectName,
            projectPath: input.projectPath,
            branch: input.branch,
            workflowId: input.workflowId,
            debugMode: input.debugMode,
            status: 'pending',
            createdAt: new Date().toISOString(),
        })
            .returning({ id: schema_1.pipelineRuns.id });
        return { id: result[0].id };
    }
    async list() {
        return this.db
            .select()
            .from(schema_1.pipelineRuns)
            .orderBy((0, drizzle_orm_1.desc)(schema_1.pipelineRuns.createdAt));
    }
    async get(id) {
        const rows = await this.db
            .select()
            .from(schema_1.pipelineRuns)
            .where((0, drizzle_orm_1.eq)(schema_1.pipelineRuns.id, id))
            .limit(1);
        return rows[0] ?? null;
    }
    async getStepResults(runId) {
        return this.db
            .select({
            id: schema_1.runStepResults.id,
            runId: schema_1.runStepResults.runId,
            stepId: schema_1.runStepResults.stepId,
            nodeId: schema_1.runStepResults.nodeId,
            position: schema_1.runStepResults.position,
            status: schema_1.runStepResults.status,
            input: schema_1.runStepResults.input,
            output: schema_1.runStepResults.output,
            startedAt: schema_1.runStepResults.startedAt,
            completedAt: schema_1.runStepResults.completedAt,
            node: {
                id: schema_1.aiNodes.id,
                name: schema_1.aiNodes.name,
                icon: schema_1.aiNodes.icon,
                color: schema_1.aiNodes.color,
                outputType: schema_1.aiNodes.outputType,
                outputPorts: schema_1.aiNodes.outputPorts,
            },
        })
            .from(schema_1.runStepResults)
            .innerJoin(schema_1.aiNodes, (0, drizzle_orm_1.eq)(schema_1.runStepResults.nodeId, schema_1.aiNodes.id))
            .where((0, drizzle_orm_1.eq)(schema_1.runStepResults.runId, runId))
            .orderBy((0, drizzle_orm_1.asc)(schema_1.runStepResults.position));
    }
    async execute(id, copilotService) {
        const run = await this.get(id);
        if (!run)
            return;
        await this.db
            .update(schema_1.pipelineRuns)
            .set({ status: 'running', startedAt: new Date().toISOString() })
            .where((0, drizzle_orm_1.eq)(schema_1.pipelineRuns.id, id));
        try {
            // Collect project files as initial context
            const files = [];
            const bytesRef = { total: 0 };
            collectFiles(run.projectPath, run.projectPath, files, bytesRef);
            const projectContext = buildProjectContext(run.projectName, run.branch, files);
            // Task data available for bindings
            const taskData = {
                files: projectContext,
                project_name: run.projectName,
                branch: run.branch,
                project_path: run.projectPath,
            };
            // Fetch workflow steps with their node definitions
            const steps = run.workflowId
                ? await this.db
                    .select({
                    id: schema_1.workflowSteps.id,
                    nodeId: schema_1.workflowSteps.nodeId,
                    position: schema_1.workflowSteps.position,
                    config: schema_1.workflowSteps.config,
                    systemPrompt: schema_1.aiNodes.systemPrompt,
                    model: schema_1.aiNodes.model,
                    name: schema_1.aiNodes.name,
                    outputType: schema_1.aiNodes.outputType,
                })
                    .from(schema_1.workflowSteps)
                    .innerJoin(schema_1.aiNodes, (0, drizzle_orm_1.eq)(schema_1.workflowSteps.nodeId, schema_1.aiNodes.id))
                    .where((0, drizzle_orm_1.eq)(schema_1.workflowSteps.workflowId, run.workflowId))
                    .orderBy((0, drizzle_orm_1.asc)(schema_1.workflowSteps.position))
                : [];
            if (steps.length === 0) {
                throw new Error('Workflow has no steps configured');
            }
            // Store outputs by step position for binding resolution
            const stepOutputs = new Map();
            let lastOutput = '';
            for (const step of steps) {
                // Resolve input from bindings or fallback to previous output / project context
                const stepConfig = parseStepConfig(step.config);
                const resolvedInput = resolveBindings(stepConfig, taskData, stepOutputs, step.position, projectContext);
                const [stepResult] = await this.db
                    .insert(schema_1.runStepResults)
                    .values({
                    runId: id,
                    stepId: step.id,
                    nodeId: step.nodeId,
                    position: step.position,
                    status: 'running',
                    input: resolvedInput.slice(0, 10000),
                    startedAt: new Date().toISOString(),
                })
                    .returning({ id: schema_1.runStepResults.id });
                try {
                    const prompt = `${step.systemPrompt}\n\n--- INPUT ---\n\n${resolvedInput}`;
                    const result = await copilotService.query({
                        prompt,
                        model: step.model || undefined,
                    });
                    lastOutput = result.content;
                    stepOutputs.set(step.position, lastOutput);
                    await this.db
                        .update(schema_1.runStepResults)
                        .set({
                        status: 'completed',
                        output: lastOutput,
                        completedAt: new Date().toISOString(),
                    })
                        .where((0, drizzle_orm_1.eq)(schema_1.runStepResults.id, stepResult.id));
                }
                catch (stepErr) {
                    const errorMsg = stepErr instanceof Error ? stepErr.message : 'Unknown step error';
                    await this.db
                        .update(schema_1.runStepResults)
                        .set({
                        status: 'error',
                        output: errorMsg,
                        completedAt: new Date().toISOString(),
                    })
                        .where((0, drizzle_orm_1.eq)(schema_1.runStepResults.id, stepResult.id));
                    throw new Error(`Step "${step.name}" failed: ${errorMsg}`);
                }
            }
            // Try to extract score from the last step output (if present)
            let score = null;
            let issues = null;
            try {
                const jsonMatch = lastOutput.match(/\{[\s\S]*\}/);
                if (jsonMatch) {
                    const parsed = JSON.parse(jsonMatch[0]);
                    if (typeof parsed.score === 'number') {
                        score = Math.max(0, Math.min(10, Math.round(parsed.score)));
                    }
                    if (Array.isArray(parsed.issues)) {
                        issues = parsed.issues.map(String);
                    }
                }
            }
            catch {
                // Not JSON — that's fine, use lastOutput as summary
            }
            await this.db
                .update(schema_1.pipelineRuns)
                .set({
                status: 'completed',
                score,
                issues: issues ? JSON.stringify(issues) : null,
                summary: lastOutput.slice(0, 5000),
                completedAt: new Date().toISOString(),
            })
                .where((0, drizzle_orm_1.eq)(schema_1.pipelineRuns.id, id));
        }
        catch (err) {
            await this.db
                .update(schema_1.pipelineRuns)
                .set({
                status: 'error',
                summary: err instanceof Error ? err.message : 'Unknown error',
                completedAt: new Date().toISOString(),
            })
                .where((0, drizzle_orm_1.eq)(schema_1.pipelineRuns.id, id));
        }
    }
}
exports.RunsService = RunsService;
