"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CopilotService = void 0;
const copilot_sdk_1 = require("@github/copilot-sdk");
class CopilotService {
    client;
    constructor(client) {
        this.client = client;
    }
    async query(input) {
        const session = await this.client.createSession({
            model: input.model ?? 'gpt-4o',
            onPermissionRequest: copilot_sdk_1.approveAll,
        });
        try {
            let content = '';
            const done = new Promise((resolve) => {
                session.on('assistant.message', (event) => {
                    content += event.data.content;
                });
                session.on('session.idle', () => resolve());
            });
            await session.send({ prompt: input.prompt });
            await done;
            return { sessionId: session.sessionId, content };
        }
        finally {
            await session.disconnect?.();
        }
    }
    async listSessions() {
        const sessions = await this.client.listSessions();
        return sessions.map((s) => ({
            sessionId: s.sessionId,
            startTime: s.startTime,
            modifiedTime: s.modifiedTime,
            summary: s.summary,
        }));
    }
}
exports.CopilotService = CopilotService;
