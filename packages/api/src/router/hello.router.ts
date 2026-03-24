import { t } from './trpc'
import { z } from 'zod'

export const helloRouter = t.router({
  hello: t.procedure
    .input(z.object({ name: z.string().optional() }))
    .query(({ input }) => {
      return { message: `Hello, ${input.name ?? 'world'}!` }
    }),
})
