import { readdirSync, readFileSync, statSync } from 'fs'
import { join, relative, extname } from 'path'
import { eq, desc, asc, inArray } from 'drizzle-orm'
import type { Db } from '../db'
import { pipelineRuns, runStepResults, workflowSteps, aiNodes } from '../db/schema'
import type { CopilotService } from '../ai/service'
import type { LoggingCopilotProxy } from '../ai/logging-copilot.proxy'
import type { TasksService } from '../tasks/tasks.service'
import type { LoggingService } from '../logging/logging.service'
import type { StepConfig, Binding } from '../types/io-ports'

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
  taskId: number
  projectName: string
  projectPath: string
  branch: string
  workflowId: number
  debugMode: boolean
}

function parseStepConfig(config: string | null): StepConfig {
  if (!config) return { bindings: {} }
  try {
    const parsed = JSON.parse(config)
    return { bindings: parsed.bindings ?? {} }
  } catch {
    return { bindings: {} }
  }
}

function resolveBindings(
  config: StepConfig,
  taskData: Record<string, string>,
  stepOutputs: Map<number, string>,
  currentPosition: number,
  fallbackInput: string,
): string {
  const bindings = config.bindings
  const bindingKeys = Object.keys(bindings)

  // No bindings configured → fallback: previous step output or project context
  if (bindingKeys.length === 0) {
    if (currentPosition === 0) return fallbackInput
    const prev = stepOutputs.get(currentPosition - 1)
    return prev ?? fallbackInput
  }

  // Resolve each binding and compose input sections
  const sections: string[] = []
  for (const [portKey, binding] of Object.entries(bindings)) {
    const value = resolveBinding(binding, taskData, stepOutputs)
    if (value) {
      sections.push(`[${portKey}]\n${value}`)
    }
  }

  return sections.length > 0 ? sections.join('\n\n') : fallbackInput
}

function resolveBinding(
  binding: Binding,
  taskData: Record<string, string>,
  stepOutputs: Map<number, string>,
): string | null {
  if (binding.source === 'task') {
    return taskData[binding.field] ?? null
  }
  if (binding.source === 'step' && binding.stepPosition !== undefined) {
    return stepOutputs.get(binding.stepPosition) ?? null
  }
  return null
}

export class RunsService {
  constructor(private readonly db: Db, private readonly logger?: LoggingService) {}

  async create(input: CreateRunInput) {
    const result = await this.db
      .insert(pipelineRuns)
      .values({
        taskId: input.taskId,
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
          outputPorts: aiNodes.outputPorts,
        },
      })
      .from(runStepResults)
      .innerJoin(aiNodes, eq(runStepResults.nodeId, aiNodes.id))
      .where(eq(runStepResults.runId, runId))
      .orderBy(asc(runStepResults.position))
  }

  async cancel(id: number) {
    const run = await this.get(id)
    if (!run) throw new Error('Run not found')
    if (run.status !== 'pending' && run.status !== 'running') {
      throw new Error(`Cannot cancel run with status "${run.status}"`)
    }
    await this.db
      .update(pipelineRuns)
      .set({ status: 'cancelled', completedAt: new Date().toISOString() })
      .where(eq(pipelineRuns.id, id))
    this.logger?.log({
      level: 'warn',
      category: 'run',
      event: 'run.cancelled',
      runId: id,
      message: `Run #${id} cancelled by user`,
    })
  }

  async delete(id: number) {
    const run = await this.get(id)
    if (!run) throw new Error('Run not found')
    if (run.status === 'pending' || run.status === 'running') {
      throw new Error('Cannot delete an active run. Cancel it first.')
    }
    await this.db.delete(runStepResults).where(eq(runStepResults.runId, id))
    await this.db.delete(pipelineRuns).where(eq(pipelineRuns.id, id))
  }

  async skipStep(stepResultId: number) {
    const rows = await this.db
      .select()
      .from(runStepResults)
      .where(eq(runStepResults.id, stepResultId))
      .limit(1)
    const step = rows[0]
    if (!step) throw new Error('Step not found')
    if (step.status !== 'pending') {
      throw new Error(`Cannot skip step with status "${step.status}"`)
    }
    await this.db
      .update(runStepResults)
      .set({ status: 'skipped', completedAt: new Date().toISOString() })
      .where(eq(runStepResults.id, stepResultId))
    this.logger?.log({
      level: 'warn',
      category: 'step',
      event: 'step.skipped',
      runId: step.runId,
      stepResultId,
      message: `Step skipped by user`,
    })
  }

  async execute(id: number, copilotService: CopilotService | LoggingCopilotProxy, tasksService: TasksService): Promise<void> {
    const run = await this.get(id)
    if (!run) return

    const runStartMs = Date.now()

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

      // Task data available for bindings
      const task = run.taskId ? await tasksService.get(run.taskId) : null
      const taskData: Record<string, string> = {
        task_name: task?.name ?? run.projectName,
        task_description: task?.description ?? '',
        files: projectContext,
        project_name: run.projectName,
        branch: run.branch,
        project_path: run.projectPath,
      }

      this.logger?.logRunStarted(id, {
        taskName: task?.name,
        projectPath: run.projectPath,
        workflowId: run.workflowId,
      })

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

      // Pre-create all step results as 'pending' so they are immediately visible in the UI
      // and so the user can skip individual steps before they execute
      const preCreated = await this.db
        .insert(runStepResults)
        .values(
          steps.map((step) => ({
            runId: id,
            stepId: step.id,
            nodeId: step.nodeId,
            position: step.position,
            status: 'pending' as const,
            startedAt: new Date().toISOString(),
          }))
        )
        .returning({ id: runStepResults.id, position: runStepResults.position })

      // Map position → pre-created step result ID
      const stepResultIdByPosition = new Map(preCreated.map((r) => [r.position, r.id]))

      // Store outputs by step position for binding resolution
      const stepOutputs: Map<number, string> = new Map()
      let lastOutput = ''

      for (const step of steps) {
        // Check if run was cancelled between steps
        const freshRun = await this.get(id)
        if (freshRun?.status === 'cancelled') {
          // Mark remaining pending steps as skipped
          const pendingIds = steps
            .filter((s) => s.position >= step.position)
            .map((s) => stepResultIdByPosition.get(s.position))
            .filter((sid): sid is number => sid !== undefined)
          if (pendingIds.length > 0) {
            await this.db
              .update(runStepResults)
              .set({ status: 'skipped', completedAt: new Date().toISOString() })
              .where(inArray(runStepResults.id, pendingIds))
          }
          return
        }

        const stepResultId = stepResultIdByPosition.get(step.position)!

        // Check if this step was skipped by the user before it ran
        const stepRow = await this.db
          .select({ status: runStepResults.status })
          .from(runStepResults)
          .where(eq(runStepResults.id, stepResultId))
          .limit(1)
        if (stepRow[0]?.status === 'skipped') {
          this.logger?.log({
            level: 'info',
            category: 'step',
            event: 'step.skipped',
            runId: id,
            stepResultId,
            message: `Step #${step.position + 1} "${step.name}" skipped`,
          })
          continue
        }

        // Resolve input from bindings or fallback to previous output / project context
        const stepConfig = parseStepConfig(step.config)

        // Log individual binding resolutions
        for (const [portKey, binding] of Object.entries(stepConfig.bindings)) {
          this.logger?.logBindingResolved(id, stepResultId, portKey, binding.source, binding.field, step.position)
        }

        const resolvedInput = resolveBindings(stepConfig, taskData, stepOutputs, step.position, projectContext)

        // Update step to running
        await this.db
          .update(runStepResults)
          .set({ status: 'running', input: resolvedInput.slice(0, 10000), startedAt: new Date().toISOString() })
          .where(eq(runStepResults.id, stepResultId))

        this.logger?.logStepStarted(id, stepResultId, {
          position: step.position,
          nodeName: step.name,
          stepId: step.id,
        })
        this.logger?.logStepInputResolved(id, stepResultId, resolvedInput, step.position)

        // Set context on proxy so AI logs carry runId + stepResultId
        if ('setContext' in copilotService) {
          (copilotService as LoggingCopilotProxy).setContext(id, stepResultId)
        }

        try {
          const systemPrompt = step.systemPrompt ?? ''
          const prompt = systemPrompt.includes('[input]')
            ? systemPrompt.replace(/\[input\]/gi, resolvedInput)
            : `${systemPrompt}\n\n--- INPUT ---\n\n${resolvedInput}`
          const result = await copilotService.query({
            prompt,
            model: step.model || undefined,
          })

          lastOutput = result.content
          stepOutputs.set(step.position, lastOutput)

          await this.db
            .update(runStepResults)
            .set({
              status: 'completed',
              output: lastOutput,
              completedAt: new Date().toISOString(),
            })
            .where(eq(runStepResults.id, stepResultId))

          this.logger?.logStepCompleted(id, stepResultId, lastOutput, step.position)
        } catch (stepErr) {
          const errorMsg = stepErr instanceof Error ? stepErr.message : 'Unknown step error'
          await this.db
            .update(runStepResults)
            .set({
              status: 'error',
              output: errorMsg,
              completedAt: new Date().toISOString(),
            })
            .where(eq(runStepResults.id, stepResultId))

          this.logger?.logStepFailed(id, stepResultId, errorMsg, step.position, step.name)
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

      this.logger?.logRunCompleted(id, {
        durationMs: Date.now() - runStartMs,
        score,
        status: 'completed',
      })
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Unknown error'
      // Don't overwrite 'cancelled' status
      const currentRun = await this.get(id)
      if (currentRun?.status === 'cancelled') return
      await this.db
        .update(pipelineRuns)
        .set({
          status: 'error',
          summary: errorMsg,
          completedAt: new Date().toISOString(),
        })
        .where(eq(pipelineRuns.id, id))

      this.logger?.logRunFailed(id, errorMsg)
    }
  }
}

