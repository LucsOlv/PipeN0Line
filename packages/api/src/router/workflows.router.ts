import { z } from 'zod'
import { t } from './trpc'

export const workflowsRouter = t.router({
  list: t.procedure.query(async ({ ctx }) => {
    return ctx.workflowsService.list()
  }),

  get: t.procedure
    .input(z.object({ id: z.number() }))
    .query(async ({ ctx, input }) => {
      return ctx.workflowsService.get(input.id)
    }),

  create: t.procedure
    .input(
      z.object({
        name: z.string().min(1),
        description: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      return ctx.workflowsService.create(input)
    }),

  update: t.procedure
    .input(
      z.object({
        id: z.number(),
        name: z.string().min(1).optional(),
        description: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const { id, ...data } = input
      return ctx.workflowsService.update(id, data)
    }),

  delete: t.procedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ ctx, input }) => {
      await ctx.workflowsService.delete(input.id)
      return { ok: true }
    }),

  addStep: t.procedure
    .input(
      z.object({
        workflowId: z.number(),
        nodeId: z.number(),
        position: z.number().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      return ctx.workflowsService.addStep(input.workflowId, input.nodeId, input.position)
    }),

  removeStep: t.procedure
    .input(z.object({ stepId: z.number() }))
    .mutation(async ({ ctx, input }) => {
      await ctx.workflowsService.removeStep(input.stepId)
      return { ok: true }
    }),

  reorderSteps: t.procedure
    .input(
      z.object({
        workflowId: z.number(),
        stepIds: z.array(z.number()),
      })
    )
    .mutation(async ({ ctx, input }) => {
      await ctx.workflowsService.reorderSteps(input.workflowId, input.stepIds)
      return { ok: true }
    }),
})
