import fp from 'fastify-plugin'
import type { FastifyInstance } from 'fastify'
import { db } from '../db'
import { seedDefaults } from '../db/seed'
import { ConfigService } from './config.service'
import { FeatureFlagsService } from './feature-flags.service'

declare module 'fastify' {
  interface FastifyInstance {
    configService: ConfigService
    featureFlagsService: FeatureFlagsService
  }
}

async function configPlugin(server: FastifyInstance) {
  const configService = new ConfigService(db)
  const featureFlagsService = new FeatureFlagsService(db)

  server.decorate('configService', configService)
  server.decorate('featureFlagsService', featureFlagsService)

  server.addHook('onReady', async () => {
    await seedDefaults()
  })
}

export default fp(configPlugin, { name: 'config-plugin' })
