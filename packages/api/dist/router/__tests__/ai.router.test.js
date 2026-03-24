"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const vitest_1 = require("vitest");
const server_1 = require("@trpc/server");
const ai_router_1 = require("../ai.router");
const mockService = {
    query: vitest_1.vi.fn().mockResolvedValue({ sessionId: 'session-abc', content: 'AI response' }),
    listSessions: vitest_1.vi.fn().mockResolvedValue([
        { sessionId: 's1', startTime: new Date(), modifiedTime: new Date(), summary: 'Test' },
    ]),
};
const ctx = { copilotService: mockService };
const t = server_1.initTRPC.context().create();
const caller = t.createCallerFactory(ai_router_1.aiRouter)(ctx);
(0, vitest_1.describe)('ai.router', () => {
    (0, vitest_1.describe)('ai.query', () => {
        (0, vitest_1.it)('returns sessionId and content', async () => {
            const result = await caller.query({ prompt: 'Hello' });
            (0, vitest_1.expect)(result.sessionId).toBe('session-abc');
            (0, vitest_1.expect)(result.content).toBe('AI response');
        });
        (0, vitest_1.it)('passes prompt and optional fields to service', async () => {
            await caller.query({ prompt: 'test', model: 'gpt-4o', sessionId: 'prev-session' });
            (0, vitest_1.expect)(mockService.query).toHaveBeenCalledWith({
                prompt: 'test',
                model: 'gpt-4o',
                sessionId: 'prev-session',
            });
        });
        (0, vitest_1.it)('rejects empty prompt', async () => {
            await (0, vitest_1.expect)(caller.query({ prompt: '' })).rejects.toThrow();
        });
    });
    (0, vitest_1.describe)('ai.listSessions', () => {
        (0, vitest_1.it)('returns session list', async () => {
            const sessions = await caller.listSessions();
            (0, vitest_1.expect)(sessions).toHaveLength(1);
            (0, vitest_1.expect)(sessions[0].sessionId).toBe('s1');
        });
    });
});
