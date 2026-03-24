import type { TaskStep } from '../../types/pipeline'
import { Icon } from '../ui/Icon'
import { StatusBadge } from '../ui/StatusBadge'

const statusColors: Record<TaskStep['status'], string> = {
  done: 'border-tertiary/20 bg-surface-container-lowest',
  running: 'border-primary/40 bg-surface-container-highest node-pulse relative',
  error: 'border-error/40 bg-surface-container-highest',
  pending: 'border-outline-variant/10 bg-surface-container-low',
}

const iconColors: Record<TaskStep['status'], string> = {
  done: 'text-tertiary',
  running: 'text-primary animate-spin',
  error: 'text-error',
  pending: 'text-on-surface-variant',
}

interface TaskStepNodeProps {
  step: TaskStep
  isLast: boolean
}

export function TaskStepNode({ step, isLast }: TaskStepNodeProps) {
  const isPending = step.status === 'pending'

  return (
    <div className={`flex-shrink-0 flex items-center gap-4 ${isPending ? 'opacity-50' : ''}`}>
      <div className={`border p-4 rounded-xl w-44 ${statusColors[step.status]}`}>
        {step.status === 'running' && (
          <div className="absolute -top-1 -right-1 flex h-3 w-3">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75" />
            <span className="relative inline-flex rounded-full h-3 w-3 bg-primary" />
          </div>
        )}
        <div className="flex justify-between items-start mb-3">
          <StatusBadge status={step.status} />
          <Icon
            name={step.icon}
            fill={step.status === 'done'}
            className={iconColors[step.status]}
          />
        </div>
        <p className="text-sm font-semibold text-white mb-1">{step.name}</p>
        <p className="text-[10px] text-on-surface-variant font-mono">{step.duration}</p>
      </div>

      {!isLast && (
        <Icon name="trending_flat" className="text-outline-variant" />
      )}
    </div>
  )
}
