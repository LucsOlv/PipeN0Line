import fp from 'fastify-plugin'
import type { FastifyInstance } from 'fastify'
import { db } from '../db'
import { migrate } from 'drizzle-orm/libsql/migrator'
import { join } from 'path'
import { seedDefaults } from '../db/seed'
import { ConfigService } from './config.service'
import { FeatureFlagsService } from './feature-flags.service'
import { RunsService } from '../runs/runs.service'
import { NodesService } from '../nodes/nodes.service'
import { WorkflowsService } from '../workflows/workflows.service'
import { TasksService } from '../tasks/tasks.service'
import { LoggingService } from '../logging/logging.service'

declare module 'fastify' {
  interface FastifyInstance {
    configService: ConfigService
    featureFlagsService: FeatureFlagsService
    runsService: RunsService
    nodesService: NodesService
    workflowsService: WorkflowsService
    tasksService: TasksService
    loggingService: LoggingService
  }
}

async function configPlugin(server: FastifyInstance) {
  // Auto-apply pending migrations at startup
  try {
    await migrate(db, { migrationsFolder: join(process.cwd(), 'src/db/migrations') })
  } catch (err) {
    server.log.error({ err }, 'DB migration failed')
  }

  const loggingService = new LoggingService(db)
  const configService = new ConfigService(db)
  const featureFlagsService = new FeatureFlagsService(db)
  const runsService = new RunsService(db, loggingService)
  const nodesService = new NodesService(db)
  const workflowsService = new WorkflowsService(db)
  const tasksService = new TasksService(db)

  server.decorate('loggingService', loggingService)
  server.decorate('configService', configService)
  server.decorate('featureFlagsService', featureFlagsService)
  server.decorate('runsService', runsService)
  server.decorate('nodesService', nodesService)
  server.decorate('workflowsService', workflowsService)
  server.decorate('tasksService', tasksService)

  server.addHook('onReady', async () => {
    await seedDefaults()
  })
}

export default fp(configPlugin, { name: 'config-plugin' })
