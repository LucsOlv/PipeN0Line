import { z } from 'zod'
import { t } from './trpc'

export const featureFlagsRouter = t.router({
  list: t.procedure.query(async ({ ctx }) => {
    return ctx.featureFlagsService.list()
  }),

  set: t.procedure
    .input(z.object({ key: z.string(), enabled: z.boolean() }))
    .mutation(async ({ ctx, input }) => {
      await ctx.featureFlagsService.set(input.key, input.enabled)
      return { ok: true }
    }),
})
