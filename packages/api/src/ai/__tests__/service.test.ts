import { describe, it, expect, vi, beforeEach } from 'vitest'
import { CopilotService } from '../service'

const mockSession = {
  sessionId: 'session-123',
  on: vi.fn(),
  send: vi.fn(),
}

const mockClient = {
  createSession: vi.fn().mockResolvedValue(mockSession),
  listSessions: vi.fn().mockResolvedValue([
    {
      sessionId: 'session-123',
      startTime: new Date('2026-01-01'),
      modifiedTime: new Date('2026-01-02'),
      summary: 'Test session',
      isRemote: false,
    },
  ]),
}

describe('CopilotService', () => {
  let service: CopilotService

  beforeEach(() => {
    vi.clearAllMocks()
    service = new CopilotService(mockClient as never)

    // Simulate assistant.message then session.idle events
    mockSession.on.mockImplementation((event: string, handler: (e: unknown) => void) => {
      if (event === 'assistant.message') {
        setTimeout(() => handler({ data: { content: 'Hello from AI' } }), 0)
      }
      if (event === 'session.idle') {
        setTimeout(() => handler({}), 1)
      }
    })
  })

  describe('query', () => {
    it('returns sessionId and content from Copilot response', async () => {
      const result = await service.query({ prompt: 'What is 2+2?' })
      expect(result.sessionId).toBe('session-123')
      expect(result.content).toBe('Hello from AI')
    })

    it('calls createSession with the provided model', async () => {
      await service.query({ prompt: 'test', model: 'claude-sonnet-4.5' })
      expect(mockClient.createSession).toHaveBeenCalledWith(
        expect.objectContaining({ model: 'claude-sonnet-4.5' })
      )
    })

    it('defaults to gpt-4o model', async () => {
      await service.query({ prompt: 'test' })
      expect(mockClient.createSession).toHaveBeenCalledWith(
        expect.objectContaining({ model: 'gpt-4o' })
      )
    })
  })

  describe('listSessions', () => {
    it('returns mapped session metadata', async () => {
      const sessions = await service.listSessions()
      expect(sessions).toHaveLength(1)
      expect(sessions[0]).toMatchObject({
        sessionId: 'session-123',
        summary: 'Test session',
      })
    })

    it('returns empty array when no sessions exist', async () => {
      mockClient.listSessions.mockResolvedValueOnce([])
      const sessions = await service.listSessions()
      expect(sessions).toEqual([])
    })
  })
})
