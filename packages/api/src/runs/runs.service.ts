import { readdirSync, readFileSync, statSync } from 'fs'
import { join, relative, extname } from 'path'
import { eq, desc } from 'drizzle-orm'
import type { Db } from '../db'
import { pipelineRuns } from '../db/schema'
import type { CopilotService } from '../ai/service'

const IGNORED_DIRS = new Set([
  'node_modules', '.git', 'dist', 'build', '.next', '.nuxt',
  'coverage', '.cache', '.turbo', 'out', '.output',
])

const IGNORED_EXTENSIONS = new Set([
  '.lock', '.log', '.png', '.jpg', '.jpeg', '.gif', '.svg', '.ico',
  '.woff', '.woff2', '.ttf', '.eot', '.mp4', '.mp3', '.zip', '.tar',
  '.gz', '.db', '.sqlite', '.bin', '.exe',
])

const MAX_FILES = 50
const MAX_TOTAL_BYTES = 100 * 1024

interface FileEntry {
  path: string
  content: string
}

function collectFiles(dir: string, rootDir: string, collected: FileEntry[], bytesRef: { total: number }): void {
  if (collected.length >= MAX_FILES || bytesRef.total >= MAX_TOTAL_BYTES) return

  let entries: string[]
  try {
    entries = readdirSync(dir)
  } catch {
    return
  }

  for (const name of entries) {
    if (collected.length >= MAX_FILES || bytesRef.total >= MAX_TOTAL_BYTES) break
    if (name.startsWith('.') && name !== '.env.example') continue

    const fullPath = join(dir, name)
    let stat
    try { stat = statSync(fullPath) } catch { continue }

    if (stat.isDirectory()) {
      if (!IGNORED_DIRS.has(name)) collectFiles(fullPath, rootDir, collected, bytesRef)
    } else if (stat.isFile()) {
      if (IGNORED_EXTENSIONS.has(extname(name).toLowerCase())) continue
      if (stat.size > 30 * 1024) continue
      try {
        const content = readFileSync(fullPath, 'utf-8')
        bytesRef.total += content.length
        if (bytesRef.total > MAX_TOTAL_BYTES) break
        collected.push({ path: relative(rootDir, fullPath), content })
      } catch {
        // skip unreadable files
      }
    }
  }
}

function buildAnalysisPrompt(projectName: string, branch: string, files: FileEntry[]): string {
  const fileBlock = files
    .map((f) => `### ${f.path}\n\`\`\`\n${f.content}\n\`\`\``)
    .join('\n\n')

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

${fileBlock}`
}

function parseAiResponse(content: string): { score: number; issues: string[]; summary: string } {
  const jsonMatch = content.match(/\{[\s\S]*\}/)
  if (!jsonMatch) throw new Error('No JSON found in AI response')

  const parsed = JSON.parse(jsonMatch[0])
  const score = Math.max(0, Math.min(10, Math.round(Number(parsed.score))))
  const issues = Array.isArray(parsed.issues) ? parsed.issues.map(String) : []
  const summary = String(parsed.summary ?? '')

  return { score, issues, summary }
}

export interface CreateRunInput {
  projectName: string
  projectPath: string
  branch: string
  debugMode: boolean
}

export class RunsService {
  constructor(private readonly db: Db) {}

  async create(input: CreateRunInput) {
    const result = await this.db
      .insert(pipelineRuns)
      .values({
        projectName: input.projectName,
        projectPath: input.projectPath,
        branch: input.branch,
        debugMode: input.debugMode,
        status: 'pending',
        createdAt: new Date().toISOString(),
      })
      .returning({ id: pipelineRuns.id })

    return { id: result[0].id }
  }

  async list() {
    return this.db
      .select()
      .from(pipelineRuns)
      .orderBy(desc(pipelineRuns.createdAt))
  }

  async get(id: number) {
    const rows = await this.db
      .select()
      .from(pipelineRuns)
      .where(eq(pipelineRuns.id, id))
      .limit(1)
    return rows[0] ?? null
  }

  async execute(id: number, copilotService: CopilotService): Promise<void> {
    const run = await this.get(id)
    if (!run) return

    await this.db
      .update(pipelineRuns)
      .set({ status: 'running', startedAt: new Date().toISOString() })
      .where(eq(pipelineRuns.id, id))

    try {
      const files: FileEntry[] = []
      const bytesRef = { total: 0 }
      collectFiles(run.projectPath, run.projectPath, files, bytesRef)

      const prompt = buildAnalysisPrompt(run.projectName, run.branch, files)
      const result = await copilotService.query({ prompt })
      const { score, issues, summary } = parseAiResponse(result.content)

      await this.db
        .update(pipelineRuns)
        .set({
          status: 'completed',
          score,
          issues: JSON.stringify(issues),
          summary,
          completedAt: new Date().toISOString(),
        })
        .where(eq(pipelineRuns.id, id))
    } catch (err) {
      await this.db
        .update(pipelineRuns)
        .set({
          status: 'error',
          summary: err instanceof Error ? err.message : 'Unknown error',
          completedAt: new Date().toISOString(),
        })
        .where(eq(pipelineRuns.id, id))
    }
  }
}

