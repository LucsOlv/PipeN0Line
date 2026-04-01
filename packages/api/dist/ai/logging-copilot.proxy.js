"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.LoggingCopilotProxy = void 0;
/**
 * Transparent delegation wrapper around CopilotService that automatically
 * logs every AI call with timing. Context (runId/stepResultId) is set by
 * RunsService before each call via setContext(). Zero manual logging needed
 * in any other part of the codebase.
 */
class LoggingCopilotProxy {
    inner;
    logger;
    _runId = 0;
    _stepResultId = 0;
    constructor(inner, logger) {
        this.inner = inner;
        this.logger = logger;
    }
    /** Called by RunsService.execute() before each AI call to attach log context. */
    setContext(runId, stepResultId) {
        this._runId = runId;
        this._stepResultId = stepResultId;
    }
    async query(input) {
        const model = input.model ?? 'gpt-4o';
        this.logger.logAiRequest(this._runId, this._stepResultId, model, input.prompt);
        const startMs = Date.now();
        try {
            const result = await this.inner.query(input);
            this.logger.logAiResponse(this._runId, this._stepResultId, result.content, Date.now() - startMs);
            return result;
        }
        catch (err) {
            const errorMsg = err instanceof Error ? err.message : String(err);
            this.logger.logAiError(this._runId, this._stepResultId, errorMsg, model);
            throw err;
        }
    }
    async listSessions() {
        return this.inner.listSessions();
    }
}
exports.LoggingCopilotProxy = LoggingCopilotProxy;
