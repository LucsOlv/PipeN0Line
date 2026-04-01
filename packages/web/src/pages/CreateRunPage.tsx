import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Icon } from '../components/ui/Icon'
import { trpc } from '../trpc'

export function CreateRunPage() {
  const navigate = useNavigate()
  const [projectPath, setProjectPath] = useState('')
  const [projectName, setProjectName] = useState('')

  // Task state
  const [taskMode, setTaskMode] = useState<'select' | 'new'>('new')
  const [selectedTaskId, setSelectedTaskId] = useState<number | null>(null)
  const [taskName, setTaskName] = useState('')
  const [taskDescription, setTaskDescription] = useState('')
  const [branch, setBranch] = useState('')

  const [workflowId, setWorkflowId] = useState<number | null>(null)
  const [debugMode, setDebugMode] = useState(true)

  const { data: projects, isLoading: projectsLoading } = trpc.projects.list.useQuery()
  const { data: projectTasks } = trpc.tasks.list.useQuery(
    { projectPath },
    { enabled: !!projectPath }
  )
  const { data: branchData, isLoading: branchesLoading } = trpc.projects.branches.useQuery(
    { path: projectPath },
    { enabled: !!projectPath && taskMode === 'new', retry: 0, staleTime: 30_000 }
  )
  const { data: workflowsList } = trpc.workflows.list.useQuery()
  const { data: selectedWorkflow } = trpc.workflows.get.useQuery(
    { id: workflowId! },
    { enabled: workflowId !== null }
  )

  const branches = branchData?.branches ?? []
  const isGitRepo = branchData?.isGitRepo ?? true

  const createTask = trpc.tasks.create.useMutation()
  const createRun = trpc.runs.create.useMutation({
    onSuccess: (data) => navigate(`/run/${data.id}`),
  })

  const selectedTask = projectTasks?.find((t) => t.id === selectedTaskId)
  const effectiveBranch = taskMode === 'select' ? (selectedTask?.branch ?? '') : branch

  const handleProjectChange = (path: string) => {
    const found = projects?.find((p) => p.path === path)
    setProjectPath(path)
    setProjectName(found?.name ?? '')
    setBranch('')
    setSelectedTaskId(null)
    setTaskMode('new')
  }

  const handleTaskSelect = (taskId: number) => {
    setSelectedTaskId(taskId)
    setTaskMode('select')
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!projectPath || !workflowId || !effectiveBranch) return

    let taskId = selectedTaskId

    if (taskMode === 'new') {
      if (!taskName.trim()) return
      const newTask = await createTask.mutateAsync({
        name: taskName.trim(),
        description: taskDescription.trim(),
        projectName,
        projectPath,
        branch,
      })
      taskId = newTask.id
    }

    if (!taskId) return
    createRun.mutate({ taskId, workflowId, debugMode })
  }

  const NODE_COLORS: Record<string, string> = {
    blue: 'bg-primary/20 text-primary border-primary/30',
    purple: 'bg-secondary/20 text-secondary border-secondary/30',
    pink: 'bg-tertiary/20 text-tertiary border-tertiary/30',
    green: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30',
    orange: 'bg-orange-500/20 text-orange-400 border-orange-500/30',
    red: 'bg-red-500/20 text-red-400 border-red-500/30',
  }

  const isPending = createTask.isPending || createRun.isPending
  const canSubmit = !!projectPath && !!workflowId && !!effectiveBranch &&
    (taskMode === 'select' ? !!selectedTaskId : !!taskName.trim())

  return (
    <div className="max-w-4xl mx-auto py-8">
      <button
        onClick={() => navigate(-1)}
        className="flex items-center gap-2 text-on-surface-variant hover:text-primary transition-colors mb-8 group"
      >
        <Icon name="arrow_back" className="text-sm group-hover:-translate-x-1 transition-transform" />
        <span className="text-sm font-medium">Voltar para Pipelines</span>
      </button>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
        {/* Form Section */}
        <div className="lg:col-span-7">
          <header className="mb-10">
            <h1 className="text-4xl md:text-5xl font-bold tracking-tighter text-on-surface mb-2">
              Criar Nova Execução
            </h1>
            <p className="text-on-surface-variant max-w-md">
              Configure os parâmetros de acionamento para a pipeline de produção.
            </p>
          </header>

          <form className="space-y-8" onSubmit={handleSubmit}>
            {/* Project */}
            <div className="space-y-3">
              <label className="block text-sm font-semibold text-on-surface-variant font-label">
                Projeto
              </label>
              <div className="relative group">
                <select
                  value={projectPath}
                  onChange={(e) => handleProjectChange(e.target.value)}
                  disabled={projectsLoading}
                  className="w-full bg-surface-container-low text-on-surface px-4 py-4 rounded-xl border-none focus:ring-1 focus:ring-primary/40 focus:bg-surface-container-highest appearance-none transition-all cursor-pointer disabled:opacity-50"
                >
                  {projectsLoading ? (
                    <option value="" disabled>Carregando projetos...</option>
                  ) : !projects || projects.length === 0 ? (
                    <option value="" disabled>
                      Configure a pasta de projetos em Configurações
                    </option>
                  ) : (
                    <>
                      <option value="" disabled>Selecione um projeto...</option>
                      {projects.map((p) => (
                        <option key={p.path} value={p.path}>{p.name}</option>
                      ))}
                    </>
                  )}
                </select>
                <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-on-surface-variant">
                  <Icon name="expand_more" />
                </div>
              </div>
              {!projectsLoading && (!projects || projects.length === 0) && (
                <p className="text-xs text-on-surface-variant flex items-center gap-1">
                  <Icon name="info" size={14} />
                  <span>
                    Nenhum projeto encontrado.{' '}
                    <button
                      type="button"
                      onClick={() => navigate('/settings')}
                      className="text-primary underline hover:no-underline"
                    >
                      Configure a pasta de projetos
                    </button>
                  </span>
                </p>
              )}
            </div>

            {/* Task */}
            {projectPath && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <label className="block text-sm font-semibold text-on-surface-variant font-label">
                    Task
                  </label>
                  {projectTasks && projectTasks.length > 0 && (
                    <div className="flex gap-1 bg-surface-container-highest rounded-lg p-0.5">
                      <button
                        type="button"
                        onClick={() => { setTaskMode('select'); setBranch('') }}
                        className={`text-xs px-3 py-1 rounded-md transition-colors ${taskMode === 'select' ? 'bg-primary/20 text-primary' : 'text-on-surface-variant hover:text-on-surface'}`}
                      >
                        Existente
                      </button>
                      <button
                        type="button"
                        onClick={() => { setTaskMode('new'); setSelectedTaskId(null) }}
                        className={`text-xs px-3 py-1 rounded-md transition-colors ${taskMode === 'new' ? 'bg-primary/20 text-primary' : 'text-on-surface-variant hover:text-on-surface'}`}
                      >
                        Nova Task
                      </button>
                    </div>
                  )}
                </div>

                {taskMode === 'select' && projectTasks && projectTasks.length > 0 ? (
                  <div className="space-y-2">
                    {projectTasks.map((task) => (
                      <button
                        key={task.id}
                        type="button"
                        onClick={() => handleTaskSelect(task.id)}
                        className={`w-full text-left p-4 rounded-xl border transition-all ${
                          selectedTaskId === task.id
                            ? 'border-primary/40 bg-primary/10'
                            : 'border-white/5 bg-surface-container-low hover:border-white/10 hover:bg-surface-container'
                        }`}
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div className="min-w-0">
                            <p className="text-sm font-medium text-on-surface truncate">{task.name}</p>
                            {task.description && (
                              <p className="text-xs text-on-surface-variant mt-0.5 line-clamp-2">{task.description}</p>
                            )}
                          </div>
                          <div className="flex items-center gap-1.5 text-xs text-on-surface-variant flex-shrink-0">
                            <Icon name="account_tree" size={12} />
                            <span>{task.branch}</span>
                          </div>
                        </div>
                      </button>
                    ))}
                  </div>
                ) : (
                  <div className="space-y-3">
                    <div className="relative">
                      <span className="absolute left-4 top-1/2 -translate-y-1/2 text-primary/60">
                        <Icon name="task_alt" className="text-lg" />
                      </span>
                      <input
                        value={taskName}
                        onChange={(e) => setTaskName(e.target.value)}
                        className="w-full bg-surface-container-low text-on-surface pl-12 pr-4 py-4 rounded-xl border-none focus:ring-1 focus:ring-primary/40 focus:bg-surface-container-highest transition-all placeholder:text-on-surface-variant/40"
                        placeholder="Nome da task..."
                        type="text"
                        required={taskMode === 'new'}
                      />
                    </div>
                    <textarea
                      value={taskDescription}
                      onChange={(e) => setTaskDescription(e.target.value)}
                      className="w-full bg-surface-container-low text-on-surface px-4 py-3 rounded-xl border-none focus:ring-1 focus:ring-primary/40 focus:bg-surface-container-highest transition-all placeholder:text-on-surface-variant/40 resize-none text-sm"
                      placeholder="Descrição da task (opcional)..."
                      rows={2}
                    />

                    {/* Branch (only for new tasks) */}
                    <div className="space-y-3">
                      <label className="block text-xs font-semibold text-on-surface-variant font-label">Branch</label>
                      {branchesLoading ? (
                        <div className="flex items-center gap-3 bg-surface-container-low px-4 py-4 rounded-xl text-on-surface-variant text-sm">
                          <Icon name="progress_activity" className="animate-spin text-primary" size={18} />
                          <span>Lendo branches do repositório...</span>
                        </div>
                      ) : projectPath && !isGitRepo ? (
                        <>
                          <div className="flex items-center gap-3 bg-surface-container-low border border-outline-variant/40 px-4 py-4 rounded-xl text-sm">
                            <Icon name="info" size={18} className="text-on-surface-variant flex-shrink-0" />
                            <span className="text-on-surface-variant">
                              Este projeto não tem repositório Git. Digite o branch manualmente.
                            </span>
                          </div>
                          <div className="relative">
                            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-primary/60">
                              <Icon name="account_tree" className="text-lg" />
                            </span>
                            <input
                              value={branch}
                              onChange={(e) => setBranch(e.target.value)}
                              className="w-full bg-surface-container-low text-on-surface pl-12 pr-4 py-4 rounded-xl border-none focus:ring-1 focus:ring-primary/40 focus:bg-surface-container-highest transition-all placeholder:text-on-surface-variant/40"
                              placeholder="main, develop, feature/xxx"
                              type="text"
                            />
                          </div>
                          <div className="flex gap-2">
                            {['main', 'develop', 'staging'].map((b) => (
                              <button
                                key={b}
                                type="button"
                                onClick={() => setBranch(b)}
                                className="px-2 py-1 bg-surface-container-highest text-[10px] text-on-surface-variant rounded border border-white/5 cursor-pointer hover:border-primary/40 transition-colors"
                              >
                                {b}
                              </button>
                            ))}
                          </div>
                        </>
                      ) : branches.length > 0 ? (
                        <div className="relative">
                          <span className="absolute left-4 top-1/2 -translate-y-1/2 text-primary/60 pointer-events-none">
                            <Icon name="account_tree" className="text-lg" />
                          </span>
                          <select
                            value={branch}
                            onChange={(e) => setBranch(e.target.value)}
                            className="w-full bg-surface-container-low text-on-surface pl-12 pr-4 py-4 rounded-xl border-none focus:ring-1 focus:ring-primary/40 focus:bg-surface-container-highest appearance-none transition-all cursor-pointer"
                          >
                            <option value="" disabled>Selecione um branch...</option>
                            {branches.map((b) => (
                              <option key={b} value={b}>{b}</option>
                            ))}
                          </select>
                          <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-on-surface-variant">
                            <Icon name="expand_more" />
                          </div>
                        </div>
                      ) : (
                        <div className="relative">
                          <span className="absolute left-4 top-1/2 -translate-y-1/2 text-primary/60">
                            <Icon name="account_tree" className="text-lg" />
                          </span>
                          <input
                            value={branch}
                            onChange={(e) => setBranch(e.target.value)}
                            className="w-full bg-surface-container-low text-on-surface pl-12 pr-4 py-4 rounded-xl border-none focus:ring-1 focus:ring-primary/40 focus:bg-surface-container-highest transition-all placeholder:text-on-surface-variant/40"
                            placeholder="Digite o branch..."
                            type="text"
                          />
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Workflow */}
            <div className="space-y-3">
              <label className="block text-sm font-semibold text-on-surface-variant font-label">
                Workflow
              </label>
              <div className="relative group">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-primary/60 pointer-events-none">
                  <Icon name="account_tree" className="text-lg" />
                </span>
                <select
                  value={workflowId ?? ''}
                  onChange={(e) => setWorkflowId(e.target.value ? Number(e.target.value) : null)}
                  className="w-full bg-surface-container-low text-on-surface pl-12 pr-4 py-4 rounded-xl border-none focus:ring-1 focus:ring-primary/40 focus:bg-surface-container-highest appearance-none transition-all cursor-pointer"
                >
                  <option value="" disabled>Selecione um workflow...</option>
                  {workflowsList?.map((w) => (
                    <option key={w.id} value={w.id}>
                      {w.name} ({w.stepCount} {w.stepCount === 1 ? 'node' : 'nodes'})
                    </option>
                  ))}
                </select>
                <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-on-surface-variant">
                  <Icon name="expand_more" />
                </div>
              </div>
              {(!workflowsList || workflowsList.length === 0) && (
                <p className="text-xs text-on-surface-variant flex items-center gap-1">
                  <Icon name="info" size={14} />
                  <span>
                    Nenhum workflow criado.{' '}
                    <button
                      type="button"
                      onClick={() => navigate('/workflows')}
                      className="text-primary underline hover:no-underline"
                    >
                      Crie um workflow
                    </button>
                  </span>
                </p>
              )}

              {/* Workflow preview */}
              {selectedWorkflow && selectedWorkflow.steps.length > 0 && (
                <div className="bg-surface-container-lowest rounded-xl p-4 border border-white/5">
                  <p className="text-[10px] text-on-surface-variant uppercase tracking-widest mb-3">
                    Pipeline Preview
                  </p>
                  <div className="flex items-center gap-2 overflow-x-auto pb-1">
                    {selectedWorkflow.steps.map((step, i) => (
                      <div key={step.id} className="flex items-center gap-2 flex-shrink-0">
                        <div className="flex flex-col items-center gap-1">
                          <div
                            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs font-medium ${
                              NODE_COLORS[step.node.color] ?? NODE_COLORS.blue
                            }`}
                          >
                            <Icon name={step.node.icon || 'smart_toy'} size={14} />
                            <span>{step.node.name}</span>
                          </div>
                          {step.node.inputPorts && (
                            <div className="flex gap-0.5">
                              {(step.node.inputPorts as { type: string }[]).slice(0, 3).map((p, j) => (
                                <span key={j} className="text-[7px] px-1 rounded bg-surface-container-high text-on-surface-variant">
                                  {p.type}
                                </span>
                              ))}
                              <span className="text-[7px] text-on-surface-variant/50">→</span>
                              {(step.node.outputPorts as { type: string }[])?.slice(0, 3).map((p, j) => (
                                <span key={j} className="text-[7px] px-1 rounded bg-surface-container-high text-on-surface-variant">
                                  {p.type}
                                </span>
                              ))}
                            </div>
                          )}
                        </div>
                        {i < selectedWorkflow.steps.length - 1 && (
                          <Icon name="arrow_forward" size={14} className="text-on-surface-variant/40" />
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Debug Mode */}
            <div className="bg-surface-container-low p-6 rounded-xl border border-white/5 space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium text-on-surface">Debug Mode</p>
                  <p className="text-xs text-on-surface-variant">
                    Executar com logs detalhados e pausa em erro.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setDebugMode(!debugMode)}
                  className={`w-10 h-5 rounded-full relative transition-colors border border-white/10 ${debugMode ? 'bg-primary/20' : 'bg-surface-container-highest'}`}
                >
                  <div
                    className={`absolute top-1 w-3 h-3 bg-primary rounded-full transition-all ${debugMode ? 'right-1' : 'left-1'}`}
                  />
                </button>
              </div>
            </div>

            {/* Error */}
            {(createRun.isError || createTask.isError) && (
              <p className="text-sm text-error flex items-center gap-1">
                <Icon name="error" size={16} /> Erro ao criar execução. Tente novamente.
              </p>
            )}

            {/* Actions */}
            <div className="flex flex-col sm:flex-row gap-4 pt-6">
              <button
                type="submit"
                disabled={!canSubmit || isPending}
                className="flex-1 bg-gradient-to-b from-primary to-primary-dim text-on-primary font-bold py-4 px-8 rounded-xl hover:brightness-110 active:scale-[0.98] transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isPending
                  ? <><Icon name="progress_activity" className="animate-spin" /> Criando...</>
                  : <><Icon name="play_arrow" fill className="text-xl" /> Confirmar / Iniciar</>
                }
              </button>
              <button
                type="button"
                onClick={() => navigate(-1)}
                className="px-8 py-4 text-on-surface-variant font-medium hover:bg-surface-container-high rounded-xl transition-all border border-transparent hover:border-outline-variant/15"
              >
                Cancelar
              </button>
            </div>
          </form>
        </div>

        {/* Bento Grid Side Panel */}
        <div className="lg:col-span-5 flex flex-col gap-6">
          <div className="bg-surface-container-highest rounded-xl p-8 relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-full -mr-16 -mt-16 blur-3xl group-hover:bg-primary/10 transition-colors" />
            <Icon name="bolt" className="text-primary text-4xl mb-6" />
            <h3 className="text-xl font-bold mb-3">Execução Imediata</h3>
            <p className="text-on-surface-variant text-sm leading-relaxed">
              Ao confirmar, os agentes do terminal Kinetic serão provisionados em clusters isolados.
              O tempo médio de inicialização para este projeto é de{' '}
              <span className="text-primary">~14 segundos</span>.
            </p>
          </div>

          {/* Selected project / task info */}
          {projectPath && (
            <div className="bg-surface-container rounded-xl p-6 border border-white/5 space-y-3">
              <p className="text-[10px] text-on-surface-variant uppercase tracking-widest">
                {selectedTask || (taskMode === 'new' && taskName) ? 'Task Selecionada' : 'Projeto Selecionado'}
              </p>
              {selectedTask ? (
                <>
                  <p className="text-sm font-bold text-on-surface">{selectedTask.name}</p>
                  {selectedTask.description && (
                    <p className="text-xs text-on-surface-variant line-clamp-2">{selectedTask.description}</p>
                  )}
                  <p className="text-[10px] text-on-surface-variant truncate font-mono">{projectPath}</p>
                  <div className="flex items-center gap-1.5 text-xs text-primary">
                    <Icon name="account_tree" size={14} />
                    <span>{selectedTask.branch}</span>
                  </div>
                </>
              ) : (
                <>
                  <p className="text-sm font-bold text-on-surface">{taskName || projectName}</p>
                  <p className="text-[10px] text-on-surface-variant truncate font-mono">{projectPath}</p>
                  {branch && (
                    <div className="flex items-center gap-1.5 text-xs text-primary">
                      <Icon name="account_tree" size={14} />
                      <span>{branch}</span>
                    </div>
                  )}
                  {branches.length > 0 && (
                    <p className="text-[10px] text-on-surface-variant">{branches.length} branches disponíveis</p>
                  )}
                </>
              )}
            </div>
          )}

          <div className="flex-1 bg-surface-container-low rounded-xl p-8 border border-white/5 relative overflow-hidden flex flex-col">
            <p className="text-xs font-bold text-on-surface-variant mb-6 flex items-center gap-2">
              <Icon name="history" className="text-sm" /> HISTÓRICO RECENTE
            </p>
            <div className="space-y-6">
              {[
                { branch: 'feature/auth-provider', time: 'há 2 horas por Admin', active: true },
                { branch: 'hotfix/typo-landing', time: 'há 5 horas por CI/CD', active: false },
              ].map((item) => (
                <div key={item.branch} className={`flex items-start gap-4 ${item.active ? '' : 'opacity-50'}`}>
                  <div className={`w-1 h-8 rounded-full mt-1 ${item.active ? 'bg-primary' : 'bg-outline-variant'}`} />
                  <div>
                    <p className="text-sm font-medium">{item.branch}</p>
                    <p className="text-[10px] text-on-surface-variant">{item.time}</p>
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-auto pt-8">
              <div className="w-full h-32 rounded-lg bg-surface-container-lowest overflow-hidden">
                <div className="w-full h-full bg-gradient-to-br from-primary/5 to-transparent p-4 flex items-end">
                  <div className="flex gap-1 w-full items-end h-16">
                    {[60, 80, 40, 90, 50, 100].map((h, i) => (
                      <div
                        key={i}
                        className="w-full rounded-t-sm"
                        style={{
                          height: `${h}%`,
                          backgroundColor: `rgba(155, 168, 255, ${0.1 + (h / 100) * 0.6})`,
                        }}
                      />
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
