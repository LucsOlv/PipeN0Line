import { initTRPC } from '@trpc/server'
import type { CopilotService } from '../ai/service'
import type { ConfigService } from '../config/config.service'
import type { FeatureFlagsService } from '../config/feature-flags.service'

export interface TrpcContext {
  copilotService: CopilotService
  configService: ConfigService
  featureFlagsService: FeatureFlagsService
}

export const t = initTRPC.context<TrpcContext>().create()
