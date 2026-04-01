import { z } from 'zod'
import { t } from './trpc'

export const tasksRouter = t.router({
  list: t.procedure
    .input(z.object({ projectPath: z.string().optional() }))
    .query(async ({ ctx, input }) => {
      return ctx.tasksService.list(input.projectPath)
    }),

  get: t.procedure
    .input(z.object({ id: z.number() }))
    .query(async ({ ctx, input }) => {
      return ctx.tasksService.get(input.id)
    }),

  create: t.procedure
    .input(
      z.object({
        name: z.string().min(1),
        description: z.string().optional(),
        projectName: z.string().min(1),
        projectPath: z.string().min(1),
        branch: z.string().min(1),
      })
    )
    .mutation(async ({ ctx, input }) => {
      return ctx.tasksService.create(input)
    }),

  update: t.procedure
    .input(
      z.object({
        id: z.number(),
        name: z.string().min(1).optional(),
        description: z.string().optional(),
        branch: z.string().min(1).optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const { id, ...data } = input
      return ctx.tasksService.update(id, data)
    }),

  delete: t.procedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ ctx, input }) => {
      await ctx.tasksService.delete(input.id)
      return { success: true }
    }),
})
