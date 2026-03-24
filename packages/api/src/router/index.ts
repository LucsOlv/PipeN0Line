import { t } from './trpc'
import { helloRouter } from './hello.router'
import { aiRouter } from './ai.router'

export const appRouter = t.mergeRouters(
  helloRouter,
  t.router({ ai: aiRouter })
)

export type AppRouter = typeof appRouter

