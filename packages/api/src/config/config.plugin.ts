import fp from 'fastify-plugin'
import type { FastifyInstance } from 'fastify'
import { db } from '../db'
import { seedDefaults } from '../db/seed'
import { ConfigService } from './config.service'
import { FeatureFlagsService } from './feature-flags.service'
import { RunsService } from '../runs/runs.service'
import { NodesService } from '../nodes/nodes.service'
import { WorkflowsService } from '../workflows/workflows.service'

declare module 'fastify' {
  interface FastifyInstance {
    configService: ConfigService
    featureFlagsService: FeatureFlagsService
    runsService: RunsService
    nodesService: NodesService
    workflowsService: WorkflowsService
  }
}

async function configPlugin(server: FastifyInstance) {
  const configService = new ConfigService(db)
  const featureFlagsService = new FeatureFlagsService(db)
  const runsService = new RunsService(db)
  const nodesService = new NodesService(db)
  const workflowsService = new WorkflowsService(db)

  server.decorate('configService', configService)
  server.decorate('featureFlagsService', featureFlagsService)
  server.decorate('runsService', runsService)
  server.decorate('nodesService', nodesService)
  server.decorate('workflowsService', workflowsService)

  server.addHook('onReady', async () => {
    await seedDefaults()
  })
}

export default fp(configPlugin, { name: 'config-plugin' })
