import { initTRPC } from '@trpc/server'
import type { CopilotService } from '../ai/service'
import type { ConfigService } from '../config/config.service'
import type { FeatureFlagsService } from '../config/feature-flags.service'
import type { RunsService } from '../runs/runs.service'
import type { NodesService } from '../nodes/nodes.service'
import type { WorkflowsService } from '../workflows/workflows.service'

export interface TrpcContext {
  copilotService: CopilotService
  configService: ConfigService
  featureFlagsService: FeatureFlagsService
  runsService: RunsService
  nodesService: NodesService
  workflowsService: WorkflowsService
}

export const t = initTRPC.context<TrpcContext>().create()
