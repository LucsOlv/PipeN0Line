import { z } from 'zod'
import { t } from './trpc'

const LOG_LEVELS = ['debug', 'info', 'warn', 'error'] as const
const LOG_CATEGORIES = ['run', 'step', 'ai', 'binding', 'system'] as const

export const logsRouter = t.router({
  list: t.procedure
    .input(
      z.object({
        runId: z.number().optional(),
        level: z.enum(LOG_LEVELS).optional(),
        category: z.enum(LOG_CATEGORIES).optional(),
        limit: z.number().min(1).max(500).default(100),
        offset: z.number().min(0).default(0),
      })
    )
    .query(async ({ ctx, input }) => {
      return ctx.loggingService.listLogs(input)
    }),

  getForRun: t.procedure
    .input(z.object({ runId: z.number() }))
    .query(async ({ ctx, input }) => {
      return ctx.loggingService.getForRun(input.runId)
    }),
})
