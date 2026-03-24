import Fastify from 'fastify'
import cors from '@fastify/cors'
import { fastifyTRPCPlugin } from '@trpc/server/adapters/fastify'
import { appRouter } from './router'

const server = Fastify({ logger: true })

const start = async () => {
  await server.register(cors, { origin: true })
  await server.register(fastifyTRPCPlugin, {
    prefix: '/trpc',
    trpcOptions: { router: appRouter },
  })
  await server.listen({ port: 3000, host: '0.0.0.0' })
}

start()
