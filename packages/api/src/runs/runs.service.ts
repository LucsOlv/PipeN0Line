import { readdirSync, readFileSync, statSync } from 'fs'
import { join, relative, extname } from 'path'
import { eq, desc, asc } from 'drizzle-orm'
import type { Db } from '../db'
import { pipelineRuns, runStepResults, workflowSteps, aiNodes } from '../db/schema'
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

function buildProjectContext(projectName: string, branch: string, files: FileEntry[]): string {
  const fileBlock = files
    .map((f) => `### ${f.path}\n\`\`\`\n${f.content}\n\`\`\``)
    .join('\n\n')

  return `Project: "${projectName}" (branch: ${branch})\n\n--- CODEBASE ---\n\n${fileBlock}`
}

export interface CreateRunInput {
  projectName: string
  projectPath: string
  branch: string
  workflowId: number
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
        workflowId: input.workflowId,
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

  async getStepResults(runId: number) {
    return this.db
      .select({
        id: runStepResults.id,
        runId: runStepResults.runId,
        stepId: runStepResults.stepId,
        nodeId: runStepResults.nodeId,
        position: runStepResults.position,
        status: runStepResults.status,
        input: runStepResults.input,
        output: runStepResults.output,
        startedAt: runStepResults.startedAt,
        completedAt: runStepResults.completedAt,
        node: {
          id: aiNodes.id,
          name: aiNodes.name,
          icon: aiNodes.icon,
          color: aiNodes.color,
          outputType: aiNodes.outputType,
        },
      })
      .from(runStepResults)
      .innerJoin(aiNodes, eq(runStepResults.nodeId, aiNodes.id))
      .where(eq(runStepResults.runId, runId))
      .orderBy(asc(runStepResults.position))
  }

  async execute(id: number, copilotService: CopilotService): Promise<void> {
    const run = await this.get(id)
    if (!run) return

    await this.db
      .update(pipelineRuns)
      .set({ status: 'running', startedAt: new Date().toISOString() })
      .where(eq(pipelineRuns.id, id))

    try {
      // Collect project files as initial context
      const files: FileEntry[] = []
      const bytesRef = { total: 0 }
      collectFiles(run.projectPath, run.projectPath, files, bytesRef)
      const projectContext = buildProjectContext(run.projectName, run.branch, files)

      // Fetch workflow steps with their node definitions
      const steps = run.workflowId
        ? await this.db
            .select({
              id: workflowSteps.id,
              nodeId: workflowSteps.nodeId,
              position: workflowSteps.position,
              config: workflowSteps.config,
              systemPrompt: aiNodes.systemPrompt,
              model: aiNodes.model,
              name: aiNodes.name,
              outputType: aiNodes.outputType,
            })
            .from(workflowSteps)
            .innerJoin(aiNodes, eq(workflowSteps.nodeId, aiNodes.id))
            .where(eq(workflowSteps.workflowId, run.workflowId))
            .orderBy(asc(workflowSteps.position))
        : []

      if (steps.length === 0) {
        throw new Error('Workflow has no steps configured')
      }

      let currentInput = projectContext
      let lastOutput = ''

      for (const step of steps) {
        // Create step result entry as "running"
        const [stepResult] = await this.db
          .insert(runStepResults)
          .values({
            runId: id,
            stepId: step.id,
            nodeId: step.nodeId,
            position: step.position,
            status: 'running',
            input: currentInput.slice(0, 10000), // cap stored input
            startedAt: new Date().toISOString(),
          })
          .returning({ id: runStepResults.id })

        try {
          const prompt = `${step.systemPrompt}\n\n--- INPUT ---\n\n${currentInput}`
          const result = await copilotService.query({
            prompt,
            model: step.model || undefined,
          })

          lastOutput = result.content

          await this.db
            .update(runStepResults)
            .set({
              status: 'completed',
              output: lastOutput,
              completedAt: new Date().toISOString(),
            })
            .where(eq(runStepResults.id, stepResult.id))

          // Output of this step becomes input for the next
          currentInput = lastOutput
        } catch (stepErr) {
          const errorMsg = stepErr instanceof Error ? stepErr.message : 'Unknown step error'
          await this.db
            .update(runStepResults)
            .set({
              status: 'error',
              output: errorMsg,
              completedAt: new Date().toISOString(),
            })
            .where(eq(runStepResults.id, stepResult.id))

          throw new Error(`Step "${step.name}" failed: ${errorMsg}`)
        }
      }

      // Try to extract score from the last step output (if present)
      let score: number | null = null
      let issues: string[] | null = null
      try {
        const jsonMatch = lastOutput.match(/\{[\s\S]*\}/)
        if (jsonMatch) {
          const parsed = JSON.parse(jsonMatch[0])
          if (typeof parsed.score === 'number') {
            score = Math.max(0, Math.min(10, Math.round(parsed.score)))
          }
          if (Array.isArray(parsed.issues)) {
            issues = parsed.issues.map(String)
          }
        }
      } catch {
        // Not JSON — that's fine, use lastOutput as summary
      }

      await this.db
        .update(pipelineRuns)
        .set({
          status: 'completed',
          score,
          issues: issues ? JSON.stringify(issues) : null,
          summary: lastOutput.slice(0, 5000),
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

