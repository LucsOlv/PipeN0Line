import type { Pipeline } from '../../types/pipeline'
import { Icon } from '../ui/Icon'
import { StatusDot } from '../ui/StatusBadge'
import { TaskStepNode } from './TaskStepNode'

const statusLabel: Record<Pipeline['status'], string> = {
  running: 'Running',
  stopped: 'Stopped',
  completed: 'Completed',
  pending: 'Pending',
}

const statusTextColor: Record<Pipeline['status'], string> = {
  running: 'text-primary-dim',
  stopped: 'text-error',
  completed: 'text-tertiary',
  pending: 'text-on-surface-variant',
}

interface PipelineCardProps {
  pipeline: Pipeline
  score?: number | null
  onClick?: () => void
  onStart?: () => void
  onStop?: () => void
  onSkip?: () => void
  onResume?: () => void
  onRetry?: () => void
  onLogs?: () => void
  onDelete?: () => void
}

export function PipelineCard({ pipeline, score, onClick, onStart, onStop, onSkip, onResume, onRetry, onLogs, onDelete }: PipelineCardProps) {
  const { status } = pipeline

  return (
    <div
      onClick={onClick}
      className={`bg-surface-container-high rounded-xl p-6 border border-white/5 shadow-2xl relative overflow-hidden ${onClick ? 'cursor-pointer hover:border-white/10 transition-colors' : ''}`}
    >
      {status === 'running' && (
        <div className="absolute top-0 right-0 w-64 h-64 bg-primary/5 blur-[100px] -z-10" />
      )}

      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 mb-8">
        <div className="flex items-start gap-4">
          <span className="bg-secondary-container/20 text-secondary px-3 py-1 rounded text-[10px] font-bold tracking-widest uppercase border border-secondary/20">
            {pipeline.tag}
          </span>
          <div>
            <h3 className="text-xl font-bold font-space-grotesk text-white">{pipeline.name}</h3>
            <div className="flex items-center gap-2 mt-1">
              <StatusDot status={status} />
              <span className={`text-xs font-medium uppercase tracking-wider ${statusTextColor[status]}`}>
                {statusLabel[status]}
              </span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {score != null && (
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-surface-container-highest border border-white/5">
              <Icon name="grade" fill className="text-sm text-tertiary" />
              <span className="text-sm font-bold font-space-grotesk text-tertiary">{score}/10</span>
            </div>
          )}
          {status === 'running' && (
            <>
              <ActionButton onClick={onStart} icon="play_arrow" label="Start" fill />
              <ActionButton onClick={onStop} icon="stop" label="Stop" fill variant="error" />
              <ActionButton onClick={onSkip} icon="skip_next" label="Skip" />
            </>
          )}
          {status === 'stopped' && (
            <>
              <ActionButton onClick={onResume} icon="play_arrow" label="Resume" fill variant="primary" />
              <ActionButton onClick={onRetry} icon="settings_backup_restore" label="Retry" />
            </>
          )}
          {status === 'completed' && (
            <ActionButton onClick={onLogs} icon="visibility" label="Ver análise" />
          )}
          {(status === 'stopped' || status === 'completed') && onDelete && (
            <ActionButton onClick={onDelete} icon="delete" label="Apagar" variant="error" />
          )}
        </div>
      </div>

      <div className="relative flex items-center gap-0 overflow-x-auto pb-4 custom-scrollbar">
        {pipeline.steps.map((step, i) => (
          <TaskStepNode
            key={step.id}
            step={step}
            isLast={i === pipeline.steps.length - 1}
          />
        ))}
      </div>
    </div>
  )
}

interface ActionButtonProps {
  onClick?: () => void
  icon: string
  label: string
  fill?: boolean
  variant?: 'default' | 'error' | 'primary'
}

function ActionButton({ onClick, icon, label, fill = false, variant = 'default' }: ActionButtonProps) {
  const base = 'p-2 rounded-lg transition-all flex items-center gap-2 border'
  const variants = {
    default: `${base} bg-surface-container-highest hover:bg-surface-bright text-on-surface border-outline-variant/10`,
    error: `${base} bg-surface-container-highest hover:bg-error/10 text-error border-outline-variant/10`,
    primary: `${base} bg-primary text-on-primary border-transparent`,
  }

  return (
    <button className={variants[variant]} onClick={(e) => { e.stopPropagation(); onClick?.() }}>
      <Icon name={icon} fill={fill} className="text-sm" />
      <span className="text-xs font-bold px-1">{label}</span>
    </button>
  )
}
