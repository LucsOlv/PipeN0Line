import { trpc } from '../../trpc'

interface FeatureFlagToggleProps {
  flagKey: string
  label: string
  description: string
  enabled: boolean
}

export function FeatureFlagToggle({ flagKey, label, description, enabled }: FeatureFlagToggleProps) {
  const utils = trpc.useUtils()

  const setFlag = trpc.featureFlags.set.useMutation({
    onSuccess: () => utils.featureFlags.list.invalidate(),
  })

  const handleToggle = () => {
    setFlag.mutate({ key: flagKey, enabled: !enabled })
  }

  return (
    <div className="flex items-start justify-between gap-4 py-3 border-b border-outline-variant last:border-0">
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-on-surface font-label">{label}</p>
        <p className="text-xs text-on-surface-variant mt-0.5">{description}</p>
      </div>
      <button
        onClick={handleToggle}
        disabled={setFlag.isPending}
        role="switch"
        aria-checked={enabled}
        className={`relative flex-shrink-0 w-10 h-6 rounded-full transition-colors duration-200 focus:outline-none disabled:opacity-50 ${
          enabled ? 'bg-primary' : 'bg-surface-container-high'
        }`}
      >
        <span
          className={`absolute top-1 left-1 w-4 h-4 rounded-full bg-white transition-transform duration-200 ${
            enabled ? 'translate-x-4' : 'translate-x-0'
          }`}
        />
      </button>
    </div>
  )
}
