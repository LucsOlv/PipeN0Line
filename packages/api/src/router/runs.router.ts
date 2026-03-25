import { z } from 'zod'
import { t } from './trpc'

export const runsRouter = t.router({
  list: t.procedure.query(async ({ ctx }) => {
    return ctx.runsService.list()
  }),

  create: t.procedure
    .input(
      z.object({
        projectName: z.string().min(1),
        projectPath: z.string().min(1),
        branch: z.string().min(1),
        debugMode: z.boolean().default(false),
      })
    )
    .mutation(async ({ ctx, input }) => {
      return ctx.runsService.create(input)
    }),
})
