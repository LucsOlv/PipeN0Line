import { useState } from 'react'
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
    cancelled: 'stopped',
  }
  return map[s] ?? 'pending'
}

const NODE_COLORS: Record<string, string> = {
  blue: 'border-primary/30 bg-primary/10',
  purple: 'border-secondary/30 bg-secondary/10',
  pink: 'border-tertiary/30 bg-tertiary/10',
  green: 'border-emerald-500/30 bg-emerald-500/10',
  orange: 'border-orange-500/30 bg-orange-500/10',
  red: 'border-red-500/30 bg-red-500/10',
}

const NODE_ICON_COLORS: Record<string, string> = {
  blue: 'text-primary',
  purple: 'text-secondary',
  pink: 'text-tertiary',
  green: 'text-emerald-400',
  orange: 'text-orange-400',
  red: 'text-red-400',
}

function StepStatusIcon({ status }: { status: string }) {
  switch (status) {
    case 'completed':
      return (
        <div className="w-6 h-6 rounded-full bg-tertiary/20 flex items-center justify-center">
          <Icon name="check" size={14} className="text-tertiary" />
        </div>
      )
    case 'running':
      return (
        <div className="w-6 h-6 rounded-full bg-primary/20 flex items-center justify-center">
          <Icon name="progress_activity" size={14} className="text-primary animate-spin" />
        </div>
      )
    case 'error':
      return (
        <div className="w-6 h-6 rounded-full bg-error/20 flex items-center justify-center">
          <Icon name="close" size={14} className="text-error" />
        </div>
      )
    case 'skipped':
      return (
        <div className="w-6 h-6 rounded-full bg-on-surface-variant/10 flex items-center justify-center">
          <Icon name="skip_next" size={14} className="text-on-surface-variant/50" />
        </div>
      )
    default:
      return (
        <div className="w-6 h-6 rounded-full bg-surface-container-highest flex items-center justify-center">
          <div className="w-2 h-2 rounded-full bg-on-surface-variant/40" />
        </div>
      )
  }
}

export function RunDetailPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const runId = Number(id)
  const [expandedSteps, setExpandedSteps] = useState<Set<number>>(new Set())
  const [activeTab, setActiveTab] = useState<'steps' | 'logs'>('steps')
  const [expandedLogMeta, setExpandedLogMeta] = useState<Set<number>>(new Set())

  const isActive = (s?: string) => s === 'pending' || s === 'running'

  const utils = trpc.useUtils()

  const { data: run, isLoading } = trpc.runs.get.useQuery(
    { id: runId },
    {
      enabled: !isNaN(runId),
      refetchInterval: (query) => isActive(query.state.data?.status) ? 2000 : false,
    }
  )

  const cancelMutation = trpc.runs.cancel.useMutation({
    onSuccess: () => utils.runs.get.invalidate({ id: runId }),
  })
  const deleteMutation = trpc.runs.delete.useMutation({
    onSuccess: () => navigate('/'),
  })
  const skipStepMutation = trpc.runs.skipStep.useMutation({
    onSuccess: () => utils.runs.getStepResults.invalidate({ runId }),
  })

  const { data: task } = trpc.tasks.get.useQuery(
    { id: run?.taskId! },
    { enabled: !!run?.taskId }
  )

  const { data: stepResults } = trpc.runs.getStepResults.useQuery(
    { runId },
    {
      enabled: !isNaN(runId),
      refetchInterval: () => isActive(run?.status) ? 2000 : false,
    }
  )

  const { data: runLogs } = trpc.logs.getForRun.useQuery(
    { runId },
    {
      enabled: !isNaN(runId),
      refetchInterval: () => isActive(run?.status) ? 2000 : false,
    }
  )

  const toggleStep = (stepId: number) => {
    setExpandedSteps((prev) => {
      const next = new Set(prev)
      if (next.has(stepId)) next.delete(stepId)
      else next.add(stepId)
      return next
    })
  }

  const toggleLogMeta = (logId: number) => {
    setExpandedLogMeta((prev) => {
      const next = new Set(prev)
      if (next.has(logId)) next.delete(logId)
      else next.add(logId)
      return next
    })
  }

  const completedSteps = stepResults?.filter((s) => s.status === 'completed').length ?? 0
  const totalSteps = stepResults?.length ?? 0

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
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-3 mb-2">
                  <span className="text-xs font-bold text-on-surface-variant font-label tracking-widest uppercase">
                    RUN-{run.id}
                  </span>
                  <StatusBadge status={mapStatus(run.status)} />
                  {run.status === 'cancelled' && (
                    <span className="text-[10px] text-error/70 font-medium">Cancelado</span>
                  )}
                </div>
                {task && (
                  <div className="flex items-center gap-2 mb-2">
                    <Icon name="task_alt" size={14} className="text-primary/60" />
                    <span className="text-xs text-primary font-medium">{task.name}</span>
                  </div>
                )}
                <h1 className="text-4xl font-bold font-space-grotesk tracking-tight text-white mb-1">
                  {run.projectName}
                </h1>
                <p className="text-on-surface-variant text-sm flex items-center gap-2">
                  <Icon name="account_tree" className="text-base" />
                  {run.branch}
                </p>
                {task?.description && (
                  <p className="text-on-surface-variant/70 text-xs mt-2 max-w-lg">{task.description}</p>
                )}
              </div>
              {/* Run action buttons */}
              <div className="flex items-center gap-2 flex-shrink-0 pt-1">
                {isActive(run.status) && (
                  <button
                    onClick={() => { if (confirm('Cancelar esta run?')) cancelMutation.mutate({ id: runId }) }}
                    disabled={cancelMutation.isPending}
                    className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-error/10 hover:bg-error/20 text-error border border-error/20 text-xs font-medium transition-colors disabled:opacity-50"
                  >
                    <Icon name="stop_circle" size={14} />
                    Cancelar
                  </button>
                )}
                {!isActive(run.status) && (
                  <button
                    onClick={() => { if (confirm('Apagar esta run permanentemente?')) deleteMutation.mutate({ id: runId }) }}
                    disabled={deleteMutation.isPending}
                    className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-surface-container hover:bg-error/10 text-on-surface-variant hover:text-error border border-white/5 text-xs font-medium transition-colors disabled:opacity-50"
                  >
                    <Icon name="delete" size={14} />
                    Apagar
                  </button>
                )}
              </div>
            </div>
          </header>

          {/* Tabs */}
          <div className="flex gap-1 bg-surface-container-highest rounded-xl p-1 mb-6 w-fit">
            <button
              onClick={() => setActiveTab('steps')}
              className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                activeTab === 'steps'
                  ? 'bg-surface-container-high text-on-surface'
                  : 'text-on-surface-variant hover:text-on-surface'
              }`}
            >
              <Icon name="account_tree" size={14} />
              Steps
              {totalSteps > 0 && (
                <span className="text-[10px] text-on-surface-variant ml-1">{completedSteps}/{totalSteps}</span>
              )}
            </button>
            <button
              onClick={() => setActiveTab('logs')}
              className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                activeTab === 'logs'
                  ? 'bg-surface-container-high text-on-surface'
                  : 'text-on-surface-variant hover:text-on-surface'
              }`}
            >
              <Icon name="receipt_long" size={14} />
              Logs
              {runLogs && runLogs.length > 0 && (
                <span className="text-[10px] text-on-surface-variant ml-1">{runLogs.length}</span>
              )}
            </button>
          </div>

          {activeTab === 'steps' && (
            <>
          {/* Progress bar */}
          {totalSteps > 0 && (
            <div className="glass-effect rounded-xl p-5 border border-white/5 mb-6">
              <div className="flex items-center justify-between mb-3">
                <p className="text-xs font-bold text-on-surface-variant uppercase tracking-widest">
                  Progresso da Pipeline
                </p>
                <span className="text-xs text-on-surface-variant">
                  {completedSteps}/{totalSteps} steps
                </span>
              </div>
              <div className="w-full h-2 bg-surface-container-highest rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-primary to-tertiary rounded-full transition-all duration-500"
                  style={{ width: totalSteps > 0 ? `${(completedSteps / totalSteps) * 100}%` : '0%' }}
                />
              </div>
            </div>
          )}

          {/* Step-by-step results */}
          {stepResults && stepResults.length > 0 && (
            <div className="space-y-3 mb-6">
              {stepResults.map((step, idx) => (
                <div
                  key={step.id}
                  className={`rounded-xl border transition-all ${
                    step.status === 'running'
                      ? 'border-primary/30 bg-primary/5'
                      : step.status === 'error'
                        ? 'border-error/20 bg-error/5'
                        : 'border-white/5 bg-surface-container-low'
                  }`}
                >
                  <button
                    onClick={() => toggleStep(step.id)}
                    className="w-full flex items-center gap-4 p-4 text-left"
                  >
                    {/* Position number */}
                    <span className="text-[10px] font-bold text-on-surface-variant w-5 text-center">
                      {idx + 1}
                    </span>

                    {/* Step status */}
                    <StepStatusIcon status={step.status} />

                    {/* Node info */}
                    <div
                      className={`w-8 h-8 rounded-lg flex items-center justify-center border ${
                        NODE_COLORS[step.node.color] ?? NODE_COLORS.blue
                      }`}
                    >
                      <Icon
                        name={step.node.icon || 'smart_toy'}
                        size={16}
                        className={NODE_ICON_COLORS[step.node.color] ?? NODE_ICON_COLORS.blue}
                      />
                    </div>

                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-on-surface truncate">{step.node.name}</p>
                      <p className="text-[10px] text-on-surface-variant">
                        {step.status === 'running' && 'Executando...'}
                        {step.status === 'completed' && step.completedAt &&
                          `Concluído em ${new Date(step.completedAt).toLocaleTimeString('pt-BR')}`}
                        {step.status === 'error' && 'Erro na execução'}
                        {step.status === 'pending' && 'Aguardando...'}
                        {step.status === 'skipped' && 'Ignorado'}
                      </p>
                    </div>

                    {/* Skip button for pending steps while run is active */}
                    {step.status === 'pending' && isActive(run.status) && (
                      <button
                        onClick={(e) => { e.stopPropagation(); skipStepMutation.mutate({ stepResultId: step.id }) }}
                        disabled={skipStepMutation.isPending}
                        className="flex items-center gap-1 px-2 py-1 rounded-lg text-[10px] font-medium text-on-surface-variant hover:text-on-surface bg-surface-container-highest hover:bg-surface-bright border border-white/5 transition-colors"
                      >
                        <Icon name="skip_next" size={12} />
                        Skip
                      </button>
                    )}

                    {/* Output ports badges */}
                    <div className="flex gap-1">
                      {(() => {
                        try {
                          const ports = JSON.parse(step.node.outputPorts || '[]') as { key: string; type: string }[]
                          if (ports.length > 0) {
                            return ports.slice(0, 2).map((p) => (
                              <span key={p.key} className="text-[9px] text-on-surface-variant bg-surface-container-highest px-1.5 py-0.5 rounded">
                                {p.type}
                              </span>
                            ))
                          }
                        } catch {}
                        return (
                          <span className="text-[10px] text-on-surface-variant bg-surface-container-highest px-2 py-0.5 rounded">
                            {step.node.outputType}
                          </span>
                        )
                      })()}
                    </div>

                    {/* Expand chevron */}
                    {(step.output || step.status === 'error') && (
                      <Icon
                        name={expandedSteps.has(step.id) ? 'expand_less' : 'expand_more'}
                        size={18}
                        className="text-on-surface-variant"
                      />
                    )}
                  </button>

                  {/* Expanded output */}
                  {expandedSteps.has(step.id) && step.output && (
                    <div className="px-4 pb-4 pt-0">
                      <div className="bg-surface-container-lowest rounded-lg p-4 max-h-80 overflow-auto">
                        <pre className="text-xs text-on-surface whitespace-pre-wrap font-mono leading-relaxed">
                          {step.output}
                        </pre>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}

          {/* Analyzing state (when no steps yet) */}
          {isActive(run.status) && (!stepResults || stepResults.length === 0) && (
            <div className="glass-effect rounded-xl p-8 border border-white/5 flex flex-col items-center gap-4 mb-8">
              <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                <Icon name="psychology" size={28} className="text-primary animate-pulse" />
              </div>
              <div className="text-center">
                <p className="text-on-surface font-semibold font-space-grotesk mb-1">
                  {run.status === 'pending' ? 'Iniciando pipeline…' : 'Preparando execução…'}
                </p>
                <p className="text-on-surface-variant text-sm">
                  Lendo arquivos do projeto e carregando workflow.
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

          {/* Summary (completed) */}
          {run.status === 'completed' && run.summary && (
            <div className="glass-effect rounded-xl p-6 border border-white/5 mb-6">
              <h2 className="text-sm font-bold text-on-surface-variant uppercase tracking-widest mb-3 flex items-center gap-2">
                <Icon name="summarize" size={16} className="text-tertiary" />
                Resultado Final
              </h2>
              <p className="text-on-surface text-sm leading-relaxed whitespace-pre-wrap">
                {run.summary.slice(0, 2000)}
              </p>
            </div>
          )}

          {/* Score (if present) */}
          {run.status === 'completed' && run.score != null && (
            <div className="glass-effect rounded-xl p-5 border border-white/5 mb-6 flex items-center gap-5">
              <div className="relative flex items-center justify-center w-16 h-16">
                <svg className="absolute inset-0 -rotate-90" width="64" height="64" viewBox="0 0 64 64">
                  <circle cx="32" cy="32" r="24" fill="none" stroke="#2a2a2a" strokeWidth="5" />
                  <circle
                    cx="32" cy="32" r="24" fill="none"
                    stroke={run.score >= 8 ? '#ffa4e4' : run.score >= 5 ? '#9ba8ff' : '#f2b8b5'}
                    strokeWidth="5"
                    strokeDasharray={`${(run.score / 10) * 2 * Math.PI * 24} ${2 * Math.PI * 24}`}
                    strokeLinecap="round"
                    style={{ transition: 'stroke-dasharray 0.8s ease' }}
                  />
                </svg>
                <span
                  className="text-xl font-bold font-space-grotesk z-10"
                  style={{ color: run.score >= 8 ? '#ffa4e4' : run.score >= 5 ? '#9ba8ff' : '#f2b8b5' }}
                >
                  {run.score}
                </span>
              </div>
              <div>
                <p className="text-sm font-bold text-on-surface">Score Global</p>
                <p className="text-xs text-on-surface-variant">Avaliação geral de qualidade do código</p>
              </div>
            </div>
          )}

          {/* Error state */}
          {run.status === 'error' && (
            <div className="glass-effect rounded-xl p-6 border border-error/20 mb-6 flex items-start gap-4">
              <Icon name="error" size={24} className="text-error mt-0.5 shrink-0" />
              <div>
                <h2 className="text-sm font-bold text-error mb-1">Pipeline falhou</h2>
                <p className="text-on-surface-variant text-sm">{run.summary || 'Erro desconhecido.'}</p>
              </div>
            </div>
          )}
            </>
          )}

          {/* Logs Tab */}
          {activeTab === 'logs' && (
            <div className="space-y-1 mb-6">
              {!runLogs || runLogs.length === 0 ? (
                <div className="text-center py-16 text-on-surface-variant">
                  <Icon name="receipt_long" size={32} className="mx-auto mb-3 opacity-30" />
                  <p className="text-sm">Nenhum log disponível para este run.</p>
                  {isActive(run.status) && (
                    <p className="text-xs mt-1 opacity-60">Logs aparecerão conforme o run avança.</p>
                  )}
                </div>
              ) : (
                runLogs.map((log) => {
                  const LEVEL_COLORS: Record<string, string> = {
                    debug: 'text-on-surface-variant/60 bg-surface-container-highest',
                    info: 'text-primary bg-primary/10',
                    warn: 'text-orange-400 bg-orange-500/10',
                    error: 'text-error bg-error/10',
                  }
                  const CATEGORY_ICONS: Record<string, string> = {
                    run: 'play_circle', step: 'looks_one', ai: 'smart_toy', binding: 'cable', system: 'settings',
                  }
                  const parsed = log.metadata ? (() => { try { return JSON.parse(log.metadata) } catch { return null } })() : null

                  return (
                    <div key={log.id} className="bg-surface-container-low rounded-xl border border-white/5 px-4 py-3">
                      <div className="flex items-start gap-3">
                        <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-md flex-shrink-0 mt-0.5 ${LEVEL_COLORS[log.level] ?? LEVEL_COLORS.info}`}>
                          {log.level.toUpperCase()}
                        </span>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="text-[10px] text-on-surface-variant/50 font-mono">
                              {new Date(log.createdAt).toLocaleTimeString('pt-BR', { hour12: false })}
                            </span>
                            <span className="text-[10px] text-on-surface-variant/40 font-mono">{log.event}</span>
                            <Icon name={CATEGORY_ICONS[log.category] ?? 'settings'} size={10} className="text-on-surface-variant/40" />
                          </div>
                          <p className="text-sm text-on-surface mt-0.5">{log.message}</p>
                          {parsed && (
                            <div className="mt-1">
                              {expandedLogMeta.has(log.id) ? (
                                <>
                                  <button onClick={() => toggleLogMeta(log.id)} className="text-[10px] text-primary/60 hover:text-primary underline">ocultar metadata</button>
                                  <pre className="text-[10px] bg-surface-container-highest rounded-lg p-2 mt-1 overflow-x-auto text-on-surface/70 whitespace-pre-wrap break-all max-h-40">
                                    {JSON.stringify(parsed, null, 2)}
                                  </pre>
                                </>
                              ) : (
                                <button onClick={() => toggleLogMeta(log.id)} className="text-[10px] text-primary/60 hover:text-primary underline">ver metadata</button>
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  )
                })
              )}
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
