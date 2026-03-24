import { z } from 'zod'
import { t } from './trpc'

export const configRouter = t.router({
  list: t.procedure.query(async ({ ctx }) => {
    return ctx.configService.list()
  }),

  get: t.procedure
    .input(z.object({ key: z.string() }))
    .query(async ({ ctx, input }) => {
      const value = await ctx.configService.get(input.key)
      return { value }
    }),

  set: t.procedure
    .input(z.object({ key: z.string(), value: z.string() }))
    .mutation(async ({ ctx, input }) => {
      await ctx.configService.set(input.key, input.value)
      return { ok: true }
    }),
})
