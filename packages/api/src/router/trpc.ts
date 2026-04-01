import { initTRPC } from '@trpc/server'
import type { CopilotService } from '../ai/service'
import type { LoggingCopilotProxy } from '../ai/logging-copilot.proxy'
import type { ConfigService } from '../config/config.service'
import type { FeatureFlagsService } from '../config/feature-flags.service'
import type { RunsService } from '../runs/runs.service'
import type { NodesService } from '../nodes/nodes.service'
import type { WorkflowsService } from '../workflows/workflows.service'
import type { TasksService } from '../tasks/tasks.service'
import type { LoggingService } from '../logging/logging.service'

export interface TrpcContext {
  copilotService: CopilotService | LoggingCopilotProxy
  configService: ConfigService
  featureFlagsService: FeatureFlagsService
  runsService: RunsService
  nodesService: NodesService
  workflowsService: WorkflowsService
  tasksService: TasksService
  loggingService: LoggingService
}

export const t = initTRPC.context<TrpcContext>().create()
