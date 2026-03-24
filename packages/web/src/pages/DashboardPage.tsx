import { mockPipelines } from '../data/mock'
import { PipelineCard } from '../components/pipeline/PipelineCard'

export function DashboardPage() {
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
        {mockPipelines.map((pipeline) => (
          <PipelineCard key={pipeline.id} pipeline={pipeline} />
        ))}
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
