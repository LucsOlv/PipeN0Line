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
        taskId: z.number(),
        workflowId: z.number(),
        debugMode: z.boolean().default(false),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const task = await ctx.tasksService.get(input.taskId)
      if (!task) throw new Error('Task not found')
      const { id } = await ctx.runsService.create({
        taskId: task.id,
        projectName: task.projectName,
        projectPath: task.projectPath,
        branch: task.branch,
        workflowId: input.workflowId,
        debugMode: input.debugMode,
      })
      // fire-and-forget: execute workflow steps without blocking the response
      ctx.runsService.execute(id, ctx.copilotService as never, ctx.tasksService).catch((err) => {
        console.error(`[runs] execute failed for run ${id}:`, err)
      })
      return { id }
    }),

  cancel: t.procedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ ctx, input }) => {
      await ctx.runsService.cancel(input.id)
    }),

  delete: t.procedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ ctx, input }) => {
      await ctx.runsService.delete(input.id)
    }),

  skipStep: t.procedure
    .input(z.object({ stepResultId: z.number() }))
    .mutation(async ({ ctx, input }) => {
      await ctx.runsService.skipStep(input.stepResultId)
    }),
})

