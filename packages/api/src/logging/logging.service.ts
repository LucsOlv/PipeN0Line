import { eq, desc, and, type SQL } from 'drizzle-orm'
import type { Db } from '../db'
import { systemLogs } from '../db/schema'

export type LogLevel = 'debug' | 'info' | 'warn' | 'error'
export type LogCategory = 'run' | 'step' | 'ai' | 'binding' | 'system'

export interface LogEntry {
  level?: LogLevel
  category: LogCategory
  event: string
  runId?: number
  stepResultId?: number
  message: string
  metadata?: Record<string, unknown>
}

export interface ListLogsFilter {
  runId?: number
  level?: LogLevel
  category?: LogCategory
  limit?: number
  offset?: number
}

function truncate(value: string | undefined | null, maxLen: number): string {
  if (!value) return ''
  return value.length > maxLen ? value.slice(0, maxLen) + `… [+${value.length - maxLen} chars]` : value
}

export class LoggingService {
  constructor(private readonly db: Db) {}

  /** Fire-and-forget log writer. Never throws. */
  log(entry: LogEntry): void {
    const metaStr = entry.metadata ? JSON.stringify(entry.metadata) : null
    this.db
      .insert(systemLogs)
      .values({
        level: entry.level ?? 'info',
        category: entry.category,
        event: entry.event,
        runId: entry.runId ?? null,
        stepResultId: entry.stepResultId ?? null,
        message: entry.message,
        metadata: metaStr,
        createdAt: new Date().toISOString(),
      })
      .catch((err) => {
        console.error('[LoggingService] Failed to write log:', err)
      })
  }

  async getForRun(runId: number) {
    try {
      return await this.db
        .select()
        .from(systemLogs)
        .where(eq(systemLogs.runId, runId))
        .orderBy(systemLogs.createdAt)
    } catch (err) {
      console.error('[LoggingService] getForRun failed:', err)
      return []
    }
  }

  async listLogs(filter: ListLogsFilter = {}) {
    try {
      const conditions: SQL[] = []
      if (filter.runId !== undefined) conditions.push(eq(systemLogs.runId, filter.runId))
      if (filter.level) conditions.push(eq(systemLogs.level, filter.level))
      if (filter.category) conditions.push(eq(systemLogs.category, filter.category))

      const query = this.db
        .select()
        .from(systemLogs)
        .orderBy(desc(systemLogs.createdAt))
        .limit(filter.limit ?? 100)
        .offset(filter.offset ?? 0)

      if (conditions.length > 0) {
        return await query.where(and(...conditions))
      }
      return await query
    } catch (err) {
      console.error('[LoggingService] listLogs failed:', err)
      return []
    }
  }

  // ─── Convenience helpers ────────────────────────────────────────────────────

  logRunStarted(runId: number, meta: { taskName?: string; projectPath: string; workflowId?: number | null }) {
    this.log({
      level: 'info',
      category: 'run',
      event: 'run.started',
      runId,
      message: `Run #${runId} started`,
      metadata: meta,
    })
  }

  logRunCompleted(runId: number, meta: { durationMs: number; score?: number | null; status: string }) {
    this.log({
      level: 'info',
      category: 'run',
      event: 'run.completed',
      runId,
      message: `Run #${runId} completed in ${meta.durationMs}ms`,
      metadata: meta,
    })
  }

  logRunFailed(runId: number, error: string) {
    this.log({
      level: 'error',
      category: 'run',
      event: 'run.failed',
      runId,
      message: `Run #${runId} failed: ${error}`,
      metadata: { error },
    })
  }

  logStepStarted(runId: number, stepResultId: number, meta: { position: number; nodeName: string; stepId: number }) {
    this.log({
      level: 'info',
      category: 'step',
      event: 'step.started',
      runId,
      stepResultId,
      message: `Step #${meta.position + 1} "${meta.nodeName}" started`,
      metadata: meta,
    })
  }

  logStepInputResolved(runId: number, stepResultId: number, input: string, position: number) {
    this.log({
      level: 'debug',
      category: 'step',
      event: 'step.input_resolved',
      runId,
      stepResultId,
      message: `Step #${position + 1} input resolved (${input.length} chars)`,
      metadata: { inputPreview: truncate(input, 2000), totalChars: input.length },
    })
  }

  logStepCompleted(runId: number, stepResultId: number, output: string, position: number) {
    this.log({
      level: 'info',
      category: 'step',
      event: 'step.completed',
      runId,
      stepResultId,
      message: `Step #${position + 1} completed (${output.length} chars output)`,
      metadata: { outputPreview: truncate(output, 2000), totalChars: output.length },
    })
  }

  logStepFailed(runId: number, stepResultId: number, error: string, position: number, nodeName: string) {
    this.log({
      level: 'error',
      category: 'step',
      event: 'step.failed',
      runId,
      stepResultId,
      message: `Step #${position + 1} "${nodeName}" failed: ${error}`,
      metadata: { error },
    })
  }

  logBindingResolved(runId: number, stepResultId: number, portKey: string, source: string, field: string, position: number) {
    this.log({
      level: 'debug',
      category: 'binding',
      event: 'binding.resolved',
      runId,
      stepResultId,
      message: `Step #${position + 1} binding "${portKey}" ← ${source}:${field}`,
      metadata: { portKey, source, field, position },
    })
  }

  logAiRequest(runId: number, stepResultId: number, model: string, prompt: string) {
    this.log({
      level: 'info',
      category: 'ai',
      event: 'ai.request',
      runId,
      stepResultId,
      message: `AI request sent (model: ${model}, ${prompt.length} chars)`,
      metadata: { model, promptPreview: truncate(prompt, 3000), totalChars: prompt.length },
    })
  }

  logAiResponse(runId: number, stepResultId: number, content: string, durationMs: number) {
    this.log({
      level: 'info',
      category: 'ai',
      event: 'ai.response',
      runId,
      stepResultId,
      message: `AI response received (${content.length} chars, ${durationMs}ms)`,
      metadata: { contentPreview: truncate(content, 3000), totalChars: content.length, durationMs },
    })
  }

  logAiError(runId: number, stepResultId: number, error: string, model: string) {
    this.log({
      level: 'error',
      category: 'ai',
      event: 'ai.error',
      runId,
      stepResultId,
      message: `AI request failed (model: ${model}): ${error}`,
      metadata: { error, model },
    })
  }
}
