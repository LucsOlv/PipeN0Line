import Fastify from 'fastify'
import cors from '@fastify/cors'
import { fastifyTRPCPlugin } from '@trpc/server/adapters/fastify'
import { appRouter } from './router'
import copilotPlugin from './ai/plugin'
import configPlugin from './config/config.plugin'

const server = Fastify({ logger: true })

const start = async () => {
  await server.register(cors, { origin: true })
  await server.register(configPlugin)
  await server.register(copilotPlugin)

  await server.register(fastifyTRPCPlugin, {
    prefix: '/trpc',
    trpcOptions: {
      router: appRouter,
      createContext: () => ({
        copilotService: server.copilotService,
        configService: server.configService,
        featureFlagsService: server.featureFlagsService,
        runsService: server.runsService,
        nodesService: server.nodesService,
        workflowsService: server.workflowsService,
        tasksService: server.tasksService,
        loggingService: server.loggingService,
      }),
    },
  })

  await server.listen({ port: 3000, host: '0.0.0.0' })
}

start()
