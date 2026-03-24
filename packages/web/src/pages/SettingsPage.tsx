import { trpc } from '../trpc'
import { ConfigInput } from '../components/settings/ConfigInput'
import { FeatureFlagToggle } from '../components/settings/FeatureFlagToggle'
import { Icon } from '../components/ui/Icon'

export function SettingsPage() {
  const { data: configs, isLoading: configsLoading } = trpc.config.list.useQuery()
  const { data: flags, isLoading: flagsLoading } = trpc.featureFlags.list.useQuery()

  const getConfig = (key: string) => configs?.find((c) => c.key === key)?.value ?? ''

  return (
    <div className="p-6 max-w-2xl mx-auto space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-on-surface font-space-grotesk flex items-center gap-2">
          <Icon name="settings" size={28} />
          Configurações
        </h1>
        <p className="text-on-surface-variant text-sm mt-1">
          Gerencie as configurações do sistema e feature flags
        </p>
      </div>

      {/* Project Config */}
      <section className="glass-effect rounded-xl p-5 space-y-4 border border-outline-variant">
        <div className="flex items-center gap-2 mb-1">
          <Icon name="folder_open" size={20} className="text-primary" />
          <h2 className="text-base font-semibold text-on-surface font-space-grotesk">Projeto</h2>
        </div>

        {configsLoading ? (
          <div className="text-sm text-on-surface-variant animate-pulse">Carregando...</div>
        ) : (
          <ConfigInput
            configKey="projectsRoot"
            label="Pasta raiz de projetos"
            description="Caminho absoluto da pasta onde seus projetos estão armazenados. As subpastas serão listadas ao criar uma nova execução."
            placeholder="/Users/seu-usuario/Projetos"
            currentValue={getConfig('projectsRoot')}
          />
        )}
      </section>

      {/* Feature Flags */}
      <section className="glass-effect rounded-xl p-5 border border-outline-variant">
        <div className="flex items-center gap-2 mb-4">
          <Icon name="toggle_on" size={20} className="text-secondary" />
          <h2 className="text-base font-semibold text-on-surface font-space-grotesk">Feature Flags</h2>
        </div>

        {flagsLoading ? (
          <div className="text-sm text-on-surface-variant animate-pulse">Carregando...</div>
        ) : flags && flags.length > 0 ? (
          <div>
            {flags.map((flag) => (
              <FeatureFlagToggle
                key={flag.key}
                flagKey={flag.key}
                label={flag.key.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())}
                description={flag.description}
                enabled={flag.enabled}
              />
            ))}
          </div>
        ) : (
          <p className="text-sm text-on-surface-variant">Nenhuma feature flag configurada.</p>
        )}
      </section>
    </div>
  )
}
