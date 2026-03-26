import { useParams, useNavigate } from 'react-router-dom'
import { trpc } from '../trpc'
import { Icon } from '../components/ui/Icon'
import { StatusBadge } from '../components/ui/StatusBadge'
import type { PipelineStatus } from '../types/pipeline'

function mapStatus(s: string): PipelineStatus {
  const map: Record<string, PipelineStatus> = {
    pending: 'pending',
    running: 'running',
    completed: 'completed',
    error: 'stopped',
  }
  return map[s] ?? 'pending'
}

function ScoreRing({ score }: { score: number }) {
  const color =
    score >= 8 ? '#ffa4e4' : score >= 5 ? '#9ba8ff' : '#f2b8b5'
  const pct = (score / 10) * 100
  const r = 36
  const circ = 2 * Math.PI * r
  const dash = (pct / 100) * circ

  return (
    <div className="relative flex items-center justify-center w-28 h-28">
      <svg className="absolute inset-0 -rotate-90" width="112" height="112" viewBox="0 0 112 112">
        <circle cx="56" cy="56" r={r} fill="none" stroke="#2a2a2a" strokeWidth="8" />
        <circle
          cx="56" cy="56" r={r} fill="none"
          stroke={color} strokeWidth="8"
          strokeDasharray={`${dash} ${circ}`}
          strokeLinecap="round"
          style={{ transition: 'stroke-dasharray 0.8s ease' }}
        />
      </svg>
      <div className="text-center z-10">
        <span className="text-3xl font-bold font-space-grotesk" style={{ color }}>{score}</span>
        <span className="text-on-surface-variant text-xs block">/10</span>
      </div>
    </div>
  )
}

export function RunDetailPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const runId = Number(id)

  const { data: run, isLoading } = trpc.runs.get.useQuery(
    { id: runId },
    {
      enabled: !isNaN(runId),
      refetchInterval: (query) => {
        const s = query.state.data?.status
        return s === 'pending' || s === 'running' ? 2000 : false
      },
    }
  )

  const issues: string[] = run?.issues ? JSON.parse(run.issues) : []
  const isAnalyzing = run?.status === 'pending' || run?.status === 'running'

  return (
    <div className="max-w-3xl mx-auto py-8 px-4">
      <button
        onClick={() => navigate('/')}
        className="flex items-center gap-2 text-on-surface-variant hover:text-primary transition-colors mb-8 group"
      >
        <Icon name="arrow_back" className="text-sm group-hover:-translate-x-1 transition-transform" />
        <span className="text-sm font-medium">Voltar para Pipelines</span>
      </button>

      {isLoading ? (
        <div className="space-y-4 animate-pulse">
          <div className="h-8 bg-surface-container-high rounded-xl w-1/3" />
          <div className="h-4 bg-surface-container rounded-xl w-1/2" />
        </div>
      ) : !run ? (
        <div className="text-on-surface-variant text-center py-24">Run não encontrado.</div>
      ) : (
        <>
          {/* Header */}
          <header className="mb-10">
            <div className="flex items-center gap-3 mb-2">
              <span className="text-xs font-bold text-on-surface-variant font-label tracking-widest uppercase">
                RUN-{run.id}
              </span>
              <StatusBadge status={mapStatus(run.status)} />
            </div>
            <h1 className="text-4xl font-bold font-space-grotesk tracking-tight text-white mb-1">
              {run.projectName}
            </h1>
            <p className="text-on-surface-variant text-sm flex items-center gap-2">
              <Icon name="account_tree" className="text-base" />
              {run.branch}
            </p>
          </header>

          {/* Analyzing state */}
          {isAnalyzing && (
            <div className="glass-effect rounded-xl p-8 border border-white/5 flex flex-col items-center gap-4 mb-8">
              <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                <Icon name="psychology" size={28} className="text-primary animate-pulse" />
              </div>
              <div className="text-center">
                <p className="text-on-surface font-semibold font-space-grotesk mb-1">
                  {run.status === 'pending' ? 'Iniciando análise…' : 'Analisando código com Copilot…'}
                </p>
                <p className="text-on-surface-variant text-sm">
                  Lendo arquivos e gerando avaliação.
                </p>
              </div>
              <div className="flex gap-1.5">
                {[0, 1, 2].map((i) => (
                  <span
                    key={i}
                    className="w-2 h-2 rounded-full bg-primary animate-bounce"
                    style={{ animationDelay: `${i * 0.15}s` }}
                  />
                ))}
              </div>
            </div>
          )}

          {/* Score + Summary */}
          {run.status === 'completed' && run.score != null && (
            <div className="glass-effect rounded-xl p-6 border border-white/5 mb-6 flex flex-col sm:flex-row items-center gap-6">
              <ScoreRing score={run.score} />
              <div className="flex-1">
                <h2 className="text-sm font-bold text-on-surface-variant uppercase tracking-widest mb-2">
                  Avaliação Geral
                </h2>
                <p className="text-on-surface leading-relaxed">{run.summary}</p>
              </div>
            </div>
          )}

          {/* Error state */}
          {run.status === 'error' && (
            <div className="glass-effect rounded-xl p-6 border border-error/20 mb-6 flex items-start gap-4">
              <Icon name="error" size={24} className="text-error mt-0.5 shrink-0" />
              <div>
                <h2 className="text-sm font-bold text-error mb-1">Análise falhou</h2>
                <p className="text-on-surface-variant text-sm">{run.summary || 'Erro desconhecido.'}</p>
              </div>
            </div>
          )}

          {/* Issues */}
          {issues.length > 0 && (
            <div className="glass-effect rounded-xl p-6 border border-white/5 mb-6">
              <h2 className="text-sm font-bold text-on-surface-variant uppercase tracking-widest mb-4 flex items-center gap-2">
                <Icon name="warning" size={16} className="text-secondary" />
                Problemas encontrados
                <span className="ml-auto text-xs font-normal bg-surface-container-high px-2 py-0.5 rounded-full">
                  {issues.length}
                </span>
              </h2>
              <ul className="space-y-3">
                {issues.map((issue, idx) => (
                  <li key={idx} className="flex items-start gap-3">
                    <span className="w-5 h-5 rounded bg-secondary/10 text-secondary text-[10px] font-bold flex items-center justify-center shrink-0 mt-0.5">
                      {idx + 1}
                    </span>
                    <span className="text-on-surface text-sm leading-relaxed">{issue}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Meta info */}
          <div className="glass-effect rounded-xl p-5 border border-white/5">
            <h2 className="text-xs font-bold text-on-surface-variant uppercase tracking-widest mb-4">
              Detalhes
            </h2>
            <dl className="grid grid-cols-2 gap-x-8 gap-y-3 text-sm">
              <div>
                <dt className="text-on-surface-variant text-xs mb-0.5">Projeto</dt>
                <dd className="text-on-surface font-medium truncate">{run.projectName}</dd>
              </div>
              <div>
                <dt className="text-on-surface-variant text-xs mb-0.5">Branch</dt>
                <dd className="text-on-surface font-medium">{run.branch}</dd>
              </div>
              <div>
                <dt className="text-on-surface-variant text-xs mb-0.5">Criado em</dt>
                <dd className="text-on-surface font-medium">
                  {new Date(run.createdAt).toLocaleString('pt-BR')}
                </dd>
              </div>
              {run.completedAt && (
                <div>
                  <dt className="text-on-surface-variant text-xs mb-0.5">Concluído em</dt>
                  <dd className="text-on-surface font-medium">
                    {new Date(run.completedAt).toLocaleString('pt-BR')}
                  </dd>
                </div>
              )}
              <div>
                <dt className="text-on-surface-variant text-xs mb-0.5">Debug mode</dt>
                <dd className="text-on-surface font-medium">{run.debugMode ? 'Ativado' : 'Desativado'}</dd>
              </div>
              <div>
                <dt className="text-on-surface-variant text-xs mb-0.5">Caminho</dt>
                <dd className="text-on-surface-variant text-xs font-mono truncate">{run.projectPath}</dd>
              </div>
            </dl>
          </div>
        </>
      )}
    </div>
  )
}
