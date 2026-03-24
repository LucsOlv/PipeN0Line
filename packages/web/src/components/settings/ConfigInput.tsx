import { useState } from 'react'
import { trpc } from '../../trpc'
import { Icon } from '../ui/Icon'

interface ConfigInputProps {
  configKey: string
  label: string
  description: string
  placeholder?: string
  currentValue: string
}

export function ConfigInput({ configKey, label, description, placeholder, currentValue }: ConfigInputProps) {
  const [value, setValue] = useState(currentValue)
  const [saved, setSaved] = useState(false)
  const utils = trpc.useUtils()

  const setConfig = trpc.config.set.useMutation({
    onSuccess: () => {
      setSaved(true)
      utils.config.list.invalidate()
      setTimeout(() => setSaved(false), 2000)
    },
  })

  const handleSave = () => {
    setConfig.mutate({ key: configKey, value })
  }

  return (
    <div className="space-y-2">
      <label className="block text-sm font-medium text-on-surface font-label">{label}</label>
      <p className="text-xs text-on-surface-variant">{description}</p>
      <div className="flex gap-2">
        <input
          type="text"
          value={value}
          onChange={(e) => { setValue(e.target.value); setSaved(false) }}
          placeholder={placeholder}
          className="flex-1 bg-surface-container border border-outline-variant rounded-xl px-3 py-2 text-sm text-on-surface placeholder-on-surface-variant focus:outline-none focus:border-primary transition-colors"
        />
        <button
          onClick={handleSave}
          disabled={setConfig.isPending}
          className="px-4 py-2 rounded-xl text-sm font-medium transition active:scale-95 disabled:opacity-50 flex items-center gap-1.5"
          style={{ backgroundColor: saved ? '#4caf50' : '#9ba8ff', color: '#0e0e0e' }}
        >
          {saved
            ? <><Icon name="check" size={16} /> Salvo</>
            : setConfig.isPending
              ? <Icon name="progress_activity" size={16} className="animate-spin" />
              : <><Icon name="save" size={16} /> Salvar</>
          }
        </button>
      </div>
    </div>
  )
}
