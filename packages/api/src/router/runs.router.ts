import { z } from 'zod'
import { t } from './trpc'

export const runsRouter = t.router({
  list: t.procedure.query(async ({ ctx }) => {
    return ctx.runsService.list()
  }),

  get: t.procedure
    .input(z.object({ id: z.number() }))
    .query(async ({ ctx, input }) => {
      return ctx.runsService.get(input.id)
    }),

  getStepResults: t.procedure
    .input(z.object({ runId: z.number() }))
    .query(async ({ ctx, input }) => {
      return ctx.runsService.getStepResults(input.runId)
    }),

  create: t.procedure
    .input(
      z.object({
        projectName: z.string().min(1),
        projectPath: z.string().min(1),
        branch: z.string().min(1),
        workflowId: z.number(),
        debugMode: z.boolean().default(false),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const { id } = await ctx.runsService.create(input)
      // fire-and-forget: execute workflow steps without blocking the response
      ctx.runsService.execute(id, ctx.copilotService).catch((err) => {
        console.error(`[runs] execute failed for run ${id}:`, err)
      })
      return { id }
    }),
})

