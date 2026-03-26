import { t } from './trpc'
import { helloRouter } from './hello.router'
import { aiRouter } from './ai.router'
import { configRouter } from './config.router'
import { featureFlagsRouter } from './feature-flags.router'
import { projectsRouter } from './projects.router'
import { runsRouter } from './runs.router'
import { nodesRouter } from './nodes.router'
import { workflowsRouter } from './workflows.router'

export const appRouter = t.mergeRouters(
  helloRouter,
  t.router({
    ai: aiRouter,
    config: configRouter,
    featureFlags: featureFlagsRouter,
    projects: projectsRouter,
    runs: runsRouter,
    nodes: nodesRouter,
    workflows: workflowsRouter,
  })
)

export type AppRouter = typeof appRouter

