import { useState } from 'react'
import { Icon } from '../components/ui/Icon'
import { trpc } from '../trpc'

const LEVEL_COLORS: Record<string, string> = {
  debug: 'text-on-surface-variant/60 bg-surface-container-highest',
  info: 'text-primary bg-primary/10',
  warn: 'text-orange-400 bg-orange-500/10',
  error: 'text-error bg-error/10',
}

const CATEGORY_COLORS: Record<string, string> = {
  run: 'text-tertiary bg-tertiary/10',
  step: 'text-primary bg-primary/10',
  ai: 'text-secondary bg-secondary/10',
  binding: 'text-emerald-400 bg-emerald-500/10',
  system: 'text-on-surface-variant bg-surface-container-highest',
}

const LEVEL_ICONS: Record<string, string> = {
  debug: 'bug_report',
  info: 'info',
  warn: 'warning',
  error: 'error',
}

const CATEGORY_ICONS: Record<string, string> = {
  run: 'play_circle',
  step: 'looks_one',
  ai: 'smart_toy',
  binding: 'cable',
  system: 'settings',
}

function MetadataView({ raw }: { raw: string | null }) {
  const [expanded, setExpanded] = useState(false)
  if (!raw) return null

  let parsed: unknown
  try {
    parsed = JSON.parse(raw)
  } catch {
    return <span className="text-on-surface-variant/50 text-xs">{raw}</span>
  }

  if (!expanded) {
    return (
      <button
        onClick={() => setExpanded(true)}
        className="text-[10px] text-primary/60 hover:text-primary underline"
      >
        ver metadata
      </button>
    )
  }

  return (
    <div className="mt-2">
      <button
        onClick={() => setExpanded(false)}
        className="text-[10px] text-primary/60 hover:text-primary underline mb-1"
      >
        ocultar
      </button>
      <pre className="text-[10px] bg-surface-container-highest rounded-lg p-3 overflow-x-auto text-on-surface/80 whitespace-pre-wrap break-all max-h-60">
        {JSON.stringify(parsed, null, 2)}
      </pre>
    </div>
  )
}

export function LogsPage() {
  const [levelFilter, setLevelFilter] = useState<string>('')
  const [categoryFilter, setCategoryFilter] = useState<string>('')
  const [runIdFilter, setRunIdFilter] = useState<string>('')
  const [limit, setLimit] = useState(100)

  const hasActiveRuns = false // could hook into runs.list if needed

  const { data: logs, isLoading, refetch } = trpc.logs.list.useQuery(
    {
      level: levelFilter as never || undefined,
      category: categoryFilter as never || undefined,
      runId: runIdFilter ? Number(runIdFilter) : undefined,
      limit,
      offset: 0,
    },
    {
      refetchInterval: hasActiveRuns ? 3000 : false,
    }
  )

  return (
    <div className="max-w-5xl mx-auto py-8">
      <header className="mb-8 flex items-start justify-between gap-4">
        <div>
          <h1 className="text-4xl md:text-5xl font-bold tracking-tighter text-on-surface mb-2">
            System Logs
          </h1>
          <p className="text-on-surface-variant text-sm">
            Registro automático de todas as operações — inputs, outputs da IA, steps e bindings.
          </p>
        </div>
        <button
          onClick={() => refetch()}
          className="flex items-center gap-1.5 text-on-surface-variant hover:text-primary text-sm px-3 py-2 rounded-lg hover:bg-surface-container transition-colors"
        >
          <Icon name="refresh" size={16} />
          Atualizar
        </button>
      </header>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3 mb-6 p-4 bg-surface-container-low rounded-xl border border-white/5">
        <Icon name="filter_list" size={16} className="text-on-surface-variant" />

        {/* Run ID */}
        <input
          type="number"
          value={runIdFilter}
          onChange={(e) => setRunIdFilter(e.target.value)}
          placeholder="Run ID..."
          className="bg-surface-container text-on-surface px-3 py-1.5 rounded-lg border-none focus:ring-1 focus:ring-primary/40 text-sm w-24 placeholder:text-on-surface-variant/40"
        />

        {/* Level */}
        <select
          value={levelFilter}
          onChange={(e) => setLevelFilter(e.target.value)}
          className="bg-surface-container text-on-surface px-3 py-1.5 rounded-lg border-none focus:ring-1 focus:ring-primary/40 text-sm cursor-pointer"
        >
          <option value="">Todos os níveis</option>
          <option value="debug">Debug</option>
          <option value="info">Info</option>
          <option value="warn">Warn</option>
          <option value="error">Error</option>
        </select>

        {/* Category */}
        <select
          value={categoryFilter}
          onChange={(e) => setCategoryFilter(e.target.value)}
          className="bg-surface-container text-on-surface px-3 py-1.5 rounded-lg border-none focus:ring-1 focus:ring-primary/40 text-sm cursor-pointer"
        >
          <option value="">Todas as categorias</option>
          <option value="run">Run</option>
          <option value="step">Step</option>
          <option value="ai">AI</option>
          <option value="binding">Binding</option>
          <option value="system">System</option>
        </select>

        {/* Limit */}
        <select
          value={limit}
          onChange={(e) => setLimit(Number(e.target.value))}
          className="bg-surface-container text-on-surface px-3 py-1.5 rounded-lg border-none focus:ring-1 focus:ring-primary/40 text-sm cursor-pointer"
        >
          <option value={50}>50 logs</option>
          <option value={100}>100 logs</option>
          <option value={250}>250 logs</option>
          <option value={500}>500 logs</option>
        </select>

        {(levelFilter || categoryFilter || runIdFilter) && (
          <button
            onClick={() => { setLevelFilter(''); setCategoryFilter(''); setRunIdFilter('') }}
            className="text-xs text-error/70 hover:text-error px-2 py-1 rounded-lg hover:bg-error/10 transition-colors"
          >
            Limpar filtros
          </button>
        )}

        <span className="ml-auto text-xs text-on-surface-variant/50">
          {logs?.length ?? 0} entradas
        </span>
      </div>

      {/* Log Table */}
      {isLoading ? (
        <div className="space-y-2 animate-pulse">
          {[1,2,3,4,5].map((i) => <div key={i} className="h-14 bg-surface-container rounded-xl" />)}
        </div>
      ) : !logs || logs.length === 0 ? (
        <div className="text-center py-24 text-on-surface-variant">
          <Icon name="receipt_long" size={40} className="mx-auto mb-4 opacity-30" />
          <p className="text-sm">Nenhum log encontrado.</p>
          <p className="text-xs mt-1 opacity-60">Execute um run para gerar logs automáticos.</p>
        </div>
      ) : (
        <div className="space-y-1">
          {logs.map((log) => (
            <div
              key={log.id}
              className="bg-surface-container-low rounded-xl border border-white/5 px-4 py-3 hover:border-white/10 transition-colors"
            >
              <div className="flex items-start gap-3">
                {/* Level badge */}
                <span className={`flex items-center gap-1 text-[10px] font-bold px-1.5 py-0.5 rounded-md flex-shrink-0 mt-0.5 ${LEVEL_COLORS[log.level] ?? LEVEL_COLORS.info}`}>
                  <Icon name={LEVEL_ICONS[log.level] ?? 'info'} size={10} />
                  {log.level.toUpperCase()}
                </span>

                {/* Category badge */}
                <span className={`flex items-center gap-1 text-[10px] font-bold px-1.5 py-0.5 rounded-md flex-shrink-0 mt-0.5 ${CATEGORY_COLORS[log.category] ?? ''}`}>
                  <Icon name={CATEGORY_ICONS[log.category] ?? 'settings'} size={10} />
                  {log.category}
                </span>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-[10px] text-on-surface-variant/50 font-mono flex-shrink-0">
                      {new Date(log.createdAt).toLocaleTimeString('pt-BR', { hour12: false })}
                    </span>
                    {log.runId && (
                      <span className="text-[10px] text-primary/50 flex-shrink-0">
                        RUN-{log.runId}
                      </span>
                    )}
                    <span className="text-[10px] text-on-surface-variant/40 font-mono flex-shrink-0">
                      {log.event}
                    </span>
                  </div>
                  <p className="text-sm text-on-surface mt-0.5">{log.message}</p>
                  <MetadataView raw={log.metadata} />
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
