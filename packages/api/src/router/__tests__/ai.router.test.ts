import { describe, it, expect, vi } from 'vitest'
import { initTRPC } from '@trpc/server'
import { z } from 'zod'
import { aiRouter } from '../ai.router'
import type { TrpcContext } from '../trpc'

const mockService = {
  query: vi.fn().mockResolvedValue({ sessionId: 'session-abc', content: 'AI response' }),
  listSessions: vi.fn().mockResolvedValue([
    { sessionId: 's1', startTime: new Date(), modifiedTime: new Date(), summary: 'Test' },
  ]),
}

const ctx: TrpcContext = {
  copilotService: mockService as never,
  configService: {} as never,
  featureFlagsService: {} as never,
}

const t = initTRPC.context<TrpcContext>().create()
const caller = t.createCallerFactory(aiRouter)(ctx)

describe('ai.router', () => {
  describe('ai.query', () => {
    it('returns sessionId and content', async () => {
      const result = await caller.query({ prompt: 'Hello' })
      expect(result.sessionId).toBe('session-abc')
      expect(result.content).toBe('AI response')
    })

    it('passes prompt and optional fields to service', async () => {
      await caller.query({ prompt: 'test', model: 'gpt-4o', sessionId: 'prev-session' })
      expect(mockService.query).toHaveBeenCalledWith({
        prompt: 'test',
        model: 'gpt-4o',
        sessionId: 'prev-session',
      })
    })

    it('rejects empty prompt', async () => {
      await expect(caller.query({ prompt: '' })).rejects.toThrow()
    })
  })

  describe('ai.listSessions', () => {
    it('returns session list', async () => {
      const sessions = await caller.listSessions()
      expect(sessions).toHaveLength(1)
      expect(sessions[0].sessionId).toBe('s1')
    })
  })
})
