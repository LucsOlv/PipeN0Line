import type { PipelineStatus, TaskStatus } from '../../types/pipeline'
import { Icon } from './Icon'

type Status = PipelineStatus | TaskStatus

interface StatusBadgeProps {
  status: Status
}

const config: Record<Status, { label: string; badge: string; dot: string; icon?: string }> = {
  done: {
    label: 'Done',
    badge: 'bg-tertiary/10 text-tertiary border-tertiary/20',
    dot: 'bg-tertiary',
    icon: 'check_circle',
  },
  running: {
    label: 'Running',
    badge: 'bg-primary/10 text-primary border-primary/20',
    dot: 'bg-primary-dim animate-pulse',
    icon: 'progress_activity',
  },
  error: {
    label: 'Error',
    badge: 'bg-error/10 text-error border-error/20',
    dot: 'bg-error animate-pulse',
    icon: 'error',
  },
  pending: {
    label: 'Pending',
    badge: 'bg-surface-variant text-on-surface-variant border-outline-variant/10',
    dot: 'bg-on-surface-variant',
    icon: 'hourglass_empty',
  },
  stopped: {
    label: 'Stopped',
    badge: 'bg-error/10 text-error border-error/20',
    dot: 'bg-error animate-pulse',
  },
  completed: {
    label: 'Completed',
    badge: 'bg-tertiary/10 text-tertiary border-tertiary/20',
    dot: 'bg-tertiary',
  },
}

export function StatusBadge({ status }: StatusBadgeProps) {
  const c = config[status]
  return (
    <span className={`text-[10px] px-2 py-0.5 rounded font-bold uppercase border ${c.badge}`}>
      {c.label}
    </span>
  )
}

export function StatusDot({ status }: StatusBadgeProps) {
  const c = config[status]
  return <span className={`flex h-2 w-2 rounded-full ${c.dot}`} />
}

export function StatusIcon({ status, className = '' }: StatusBadgeProps & { className?: string }) {
  const c = config[status]
  if (!c.icon) return null
  const isAnimated = status === 'running'
  return (
    <Icon
      name={c.icon}
      fill={status === 'done'}
      className={`${className} ${isAnimated ? 'animate-spin' : ''}`}
    />
  )
}
