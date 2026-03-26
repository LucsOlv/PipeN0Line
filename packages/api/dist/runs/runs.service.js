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
function buildAnalysisPrompt(projectName, branch, files) {
    const fileBlock = files
        .map((f) => `### ${f.path}\n\`\`\`\n${f.content}\n\`\`\``)
        .join('\n\n');
    return `You are a senior software engineer performing a code review of the project "${projectName}" (branch: ${branch}).

Analyze the codebase below and respond ONLY with a valid JSON object (no markdown, no explanation outside the JSON) in this exact format:
{
  "score": <integer 0-10>,
  "issues": ["<issue 1>", "<issue 2>", ...],
  "summary": "<brief 2-3 sentence summary of the code quality>"
}

Rules:
- score: 0 (terrible) to 10 (excellent). Be objective.
- issues: list the most important problems found (max 10). Be specific and actionable.
- summary: concise overall assessment.

--- CODEBASE ---

${fileBlock}`;
}
function parseAiResponse(content) {
    const jsonMatch = content.match(/\{[\s\S]*\}/);
    if (!jsonMatch)
        throw new Error('No JSON found in AI response');
    const parsed = JSON.parse(jsonMatch[0]);
    const score = Math.max(0, Math.min(10, Math.round(Number(parsed.score))));
    const issues = Array.isArray(parsed.issues) ? parsed.issues.map(String) : [];
    const summary = String(parsed.summary ?? '');
    return { score, issues, summary };
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
    async execute(id, copilotService) {
        const run = await this.get(id);
        if (!run)
            return;
        await this.db
            .update(schema_1.pipelineRuns)
            .set({ status: 'running', startedAt: new Date().toISOString() })
            .where((0, drizzle_orm_1.eq)(schema_1.pipelineRuns.id, id));
        try {
            const files = [];
            const bytesRef = { total: 0 };
            collectFiles(run.projectPath, run.projectPath, files, bytesRef);
            const prompt = buildAnalysisPrompt(run.projectName, run.branch, files);
            const result = await copilotService.query({ prompt });
            const { score, issues, summary } = parseAiResponse(result.content);
            await this.db
                .update(schema_1.pipelineRuns)
                .set({
                status: 'completed',
                score,
                issues: JSON.stringify(issues),
                summary,
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
