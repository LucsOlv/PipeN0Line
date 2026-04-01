import { CopilotService } from './service'
import type { AiQueryInput, AiQueryOutput, AiSessionMeta } from './types'
import type { LoggingService } from '../logging/logging.service'

/**
 * Transparent delegation wrapper around CopilotService that automatically
 * logs every AI call with timing. Context (runId/stepResultId) is set by
 * RunsService before each call via setContext(). Zero manual logging needed
 * in any other part of the codebase.
 */
export class LoggingCopilotProxy {
  private _runId = 0
  private _stepResultId = 0

  constructor(
    private readonly inner: CopilotService,
    private readonly logger: LoggingService,
  ) {}

  /** Called by RunsService.execute() before each AI call to attach log context. */
  setContext(runId: number, stepResultId: number) {
    this._runId = runId
    this._stepResultId = stepResultId
  }

  async query(input: AiQueryInput): Promise<AiQueryOutput> {
    const model = input.model ?? 'gpt-4o'
    this.logger.logAiRequest(this._runId, this._stepResultId, model, input.prompt)
    const startMs = Date.now()

    try {
      const result = await this.inner.query(input)
      this.logger.logAiResponse(this._runId, this._stepResultId, result.content, Date.now() - startMs)
      return result
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : String(err)
      this.logger.logAiError(this._runId, this._stepResultId, errorMsg, model)
      throw err
    }
  }

  async listSessions(): Promise<AiSessionMeta[]> {
    return this.inner.listSessions()
  }
}

