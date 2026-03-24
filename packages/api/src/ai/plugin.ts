import fp from 'fastify-plugin'
import type { FastifyInstance } from 'fastify'
import { getCopilotClient, startCopilotClient, stopCopilotClient } from './client'
import { CopilotService } from './service'

declare module 'fastify' {
  interface FastifyInstance {
    copilotService: CopilotService
  }
}

async function copilotPlugin(server: FastifyInstance) {
  await startCopilotClient()
  const service = new CopilotService(getCopilotClient())

  server.decorate('copilotService', service)

  server.addHook('onClose', async () => {
    await stopCopilotClient()
  })
}

export default fp(copilotPlugin, {
  name: 'copilot',
  fastify: '5.x',
})
