import { z } from 'zod'
import { t } from './trpc'
import { ioPortSchema } from '../types/io-ports'

export const nodesRouter = t.router({
  list: t.procedure.query(async ({ ctx }) => {
    return ctx.nodesService.list()
  }),

  get: t.procedure
    .input(z.object({ id: z.number() }))
    .query(async ({ ctx, input }) => {
      return ctx.nodesService.get(input.id)
    }),

  create: t.procedure
    .input(
      z.object({
        name: z.string().min(1),
        description: z.string().optional(),
        model: z.string().optional(),
        systemPrompt: z.string().min(1),
        inputType: z.string().optional(),
        outputType: z.string().optional(),
        inputPorts: z.array(ioPortSchema).min(1).optional(),
        outputPorts: z.array(ioPortSchema).min(1).optional(),
        color: z.string().optional(),
        icon: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      return ctx.nodesService.create(input)
    }),

  update: t.procedure
    .input(
      z.object({
        id: z.number(),
        name: z.string().min(1).optional(),
        description: z.string().optional(),
        model: z.string().optional(),
        systemPrompt: z.string().min(1).optional(),
        inputType: z.string().optional(),
        outputType: z.string().optional(),
        inputPorts: z.array(ioPortSchema).min(1).optional(),
        outputPorts: z.array(ioPortSchema).min(1).optional(),
        color: z.string().optional(),
        icon: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const { id, ...data } = input
      return ctx.nodesService.update(id, data)
    }),

  delete: t.procedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ ctx, input }) => {
      await ctx.nodesService.delete(input.id)
      return { ok: true }
    }),
})
