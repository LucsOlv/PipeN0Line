import { z } from 'zod'
import { t } from './trpc'

export const aiRouter = t.router({
  query: t.procedure
    .input(
      z.object({
        prompt: z.string().min(1),
        sessionId: z.string().optional(),
        model: z.string().optional(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      return ctx.copilotService.query(input)
    }),

  listSessions: t.procedure.query(async ({ ctx }) => {
    return ctx.copilotService.listSessions()
  }),
})
