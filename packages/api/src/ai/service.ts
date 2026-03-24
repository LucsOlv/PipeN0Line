import { CopilotClient, approveAll } from '@github/copilot-sdk'
import type { AiQueryInput, AiQueryOutput, AiSessionMeta } from './types'

export class CopilotService {
  constructor(private readonly client: CopilotClient) {}

  async query(input: AiQueryInput): Promise<AiQueryOutput> {
    const session = await this.client.createSession({
      model: input.model ?? 'gpt-4o',
      onPermissionRequest: approveAll,
    })

    try {
      let content = ''
      const done = new Promise<void>((resolve) => {
        session.on('assistant.message', (event) => {
          content += event.data.content
        })
        session.on('session.idle', () => resolve())
      })

      await session.send({ prompt: input.prompt })
      await done

      return { sessionId: session.sessionId, content }
    } finally {
      await session.disconnect?.()
    }
  }

  async listSessions(): Promise<AiSessionMeta[]> {
    const sessions = await this.client.listSessions()
    return sessions.map((s) => ({
      sessionId: s.sessionId,
      startTime: s.startTime,
      modifiedTime: s.modifiedTime,
      summary: s.summary,
    }))
  }
}
