import { trpc } from '../trpc'
import { PipelineCard } from '../components/pipeline/PipelineCard'
import type { Pipeline } from '../types/pipeline'
import { Icon } from '../components/ui/Icon'
import { useNavigate } from 'react-router-dom'

function mapRunToPipeline(run: {
  id: number
  projectName: string
  branch: string
  status: string
  createdAt: string
}): Pipeline {
  const statusMap: Record<string, Pipeline['status']> = {
    pending: 'pending',
    running: 'running',
    completed: 'completed',
    stopped: 'stopped',
    error: 'stopped',
  }

  return {
    id: String(run.id),
    tag: `RUN-${run.id}`,
    name: run.projectName,
    status: statusMap[run.status] ?? 'pending',
    steps: [
      {
        id: 'branch',
        name: run.branch,
        status: run.status === 'completed' ? 'done' : run.status === 'running' ? 'running' : run.status === 'stopped' || run.status === 'error' ? 'error' : 'pending',
        duration: new Date(run.createdAt).toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' }),
        icon: 'account_tree',
      },
    ],
  }
}

export function DashboardPage() {
  const navigate = useNavigate()
  const { data: runs, isLoading } = trpc.runs.list.useQuery(undefined, {
    refetchInterval: (query) => {
      const hasActive = query.state.data?.some(
        (r) => r.status === 'pending' || r.status === 'running'
      )
      return hasActive ? 2000 : false
    },
  })

  const pipelines = runs?.map(mapRunToPipeline) ?? []

  return (
    <>
      <header className="mb-12">
        <h1 className="text-4xl font-bold font-space-grotesk tracking-tight text-white mb-2">
          System <span className="text-primary-dim">Orchestration</span>
        </h1>
        <p className="text-on-surface-variant font-body">
          Real-time pipeline execution and node monitoring across the kinetic infrastructure.
        </p>
      </header>

      <section className="space-y-6">
        {isLoading ? (
          [1, 2].map((i) => (
            <div key={i} className="glass-effect rounded-xl p-6 border border-white/5 animate-pulse">
              <div className="h-4 bg-surface-container-high rounded w-1/3 mb-3" />
              <div className="h-3 bg-surface-container rounded w-1/2" />
            </div>
          ))
        ) : pipelines.length > 0 ? (
          pipelines.map((pipeline, i) => (
            <PipelineCard
              key={pipeline.id}
              pipeline={pipeline}
              score={runs?.[i]?.score}
              onClick={() => navigate(`/run/${pipeline.id}`)}
              onLogs={() => navigate(`/run/${pipeline.id}`)}
            />
          ))
        ) : (
          <div className="flex flex-col items-center justify-center py-24 text-center">
            <div className="w-16 h-16 rounded-full bg-surface-container-high flex items-center justify-center mb-6">
              <Icon name="inbox" size={32} className="text-on-surface-variant" />
            </div>
            <h2 className="text-lg font-semibold text-on-surface mb-2 font-space-grotesk">
              Nenhuma execução ainda
            </h2>
            <p className="text-on-surface-variant text-sm mb-6 max-w-xs">
              Crie a primeira execução selecionando um projeto e branch.
            </p>
            <button
              onClick={() => navigate('/run/new')}
              className="flex items-center gap-2 px-5 py-2.5 bg-primary text-on-primary rounded-xl text-sm font-medium hover:brightness-110 active:scale-95 transition-all"
            >
              <Icon name="add" size={18} />
              Nova Execução
            </button>
          </div>
        )}
      </section>

      <footer className="mt-16 pt-8 border-t border-white/5 flex flex-col md:flex-row justify-between items-center gap-4">
        <p className="text-xs text-on-surface-variant font-body">
          Kinetic Orchestrator Engine © 2024. All systems operational.
        </p>
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-primary-dim shadow-[0_0_8px_rgba(73,99,255,0.6)]" />
            <span className="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant">
              Cluster: North-US-1
            </span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-tertiary shadow-[0_0_8px_rgba(255,164,228,0.6)]" />
            <span className="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant">
              API: v2.4
            </span>
          </div>
        </div>
      </footer>
    </>
  )
}

