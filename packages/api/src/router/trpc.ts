import { initTRPC } from '@trpc/server'
import type { CopilotService } from '../ai/service'

export interface TrpcContext {
  copilotService: CopilotService
}

export const t = initTRPC.context<TrpcContext>().create()
