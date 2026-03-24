"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const vitest_1 = require("vitest");
const service_1 = require("../service");
const mockSession = {
    sessionId: 'session-123',
    on: vitest_1.vi.fn(),
    send: vitest_1.vi.fn(),
};
const mockClient = {
    createSession: vitest_1.vi.fn().mockResolvedValue(mockSession),
    listSessions: vitest_1.vi.fn().mockResolvedValue([
        {
            sessionId: 'session-123',
            startTime: new Date('2026-01-01'),
            modifiedTime: new Date('2026-01-02'),
            summary: 'Test session',
            isRemote: false,
        },
    ]),
};
(0, vitest_1.describe)('CopilotService', () => {
    let service;
    (0, vitest_1.beforeEach)(() => {
        vitest_1.vi.clearAllMocks();
        service = new service_1.CopilotService(mockClient);
        // Simulate assistant.message then session.idle events
        mockSession.on.mockImplementation((event, handler) => {
            if (event === 'assistant.message') {
                setTimeout(() => handler({ data: { content: 'Hello from AI' } }), 0);
            }
            if (event === 'session.idle') {
                setTimeout(() => handler({}), 1);
            }
        });
    });
    (0, vitest_1.describe)('query', () => {
        (0, vitest_1.it)('returns sessionId and content from Copilot response', async () => {
            const result = await service.query({ prompt: 'What is 2+2?' });
            (0, vitest_1.expect)(result.sessionId).toBe('session-123');
            (0, vitest_1.expect)(result.content).toBe('Hello from AI');
        });
        (0, vitest_1.it)('calls createSession with the provided model', async () => {
            await service.query({ prompt: 'test', model: 'claude-sonnet-4.5' });
            (0, vitest_1.expect)(mockClient.createSession).toHaveBeenCalledWith(vitest_1.expect.objectContaining({ model: 'claude-sonnet-4.5' }));
        });
        (0, vitest_1.it)('defaults to gpt-4o model', async () => {
            await service.query({ prompt: 'test' });
            (0, vitest_1.expect)(mockClient.createSession).toHaveBeenCalledWith(vitest_1.expect.objectContaining({ model: 'gpt-4o' }));
        });
    });
    (0, vitest_1.describe)('listSessions', () => {
        (0, vitest_1.it)('returns mapped session metadata', async () => {
            const sessions = await service.listSessions();
            (0, vitest_1.expect)(sessions).toHaveLength(1);
            (0, vitest_1.expect)(sessions[0]).toMatchObject({
                sessionId: 'session-123',
                summary: 'Test session',
            });
        });
        (0, vitest_1.it)('returns empty array when no sessions exist', async () => {
            mockClient.listSessions.mockResolvedValueOnce([]);
            const sessions = await service.listSessions();
            (0, vitest_1.expect)(sessions).toEqual([]);
        });
    });
});
