import fp from 'fastify-plugin'
import type { FastifyInstance } from 'fastify'
import { getCopilotClient, startCopilotClient, stopCopilotClient } from './client'
import { CopilotService } from './service'
import { LoggingCopilotProxy } from './logging-copilot.proxy'

declare module 'fastify' {
  interface FastifyInstance {
    copilotService: CopilotService
  }
}

async function copilotPlugin(server: FastifyInstance) {
  await startCopilotClient()
  const bare = new CopilotService(getCopilotClient())
  const service = server.loggingService
    ? new LoggingCopilotProxy(bare, server.loggingService)
    : bare

  server.decorate('copilotService', service as unknown as CopilotService)

  server.addHook('onClose', async () => {
    await stopCopilotClient()
  })
}

export default fp(copilotPlugin, {
  name: 'copilot',
  fastify: '5.x',
  dependencies: ['config-plugin'],
})
