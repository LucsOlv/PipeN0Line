import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Icon } from '../components/ui/Icon'
import { trpc } from '../trpc'

interface TaskFormState {
  name: string
  description: string
  branch: string
}

export function TasksPage() {
  const navigate = useNavigate()
  const utils = trpc.useUtils()

  const [showCreateForm, setShowCreateForm] = useState(false)
  const [editingId, setEditingId] = useState<number | null>(null)
  const [form, setForm] = useState<TaskFormState>({ name: '', description: '', branch: '' })
  const [selectedProject, setSelectedProject] = useState('')

  const { data: projects, isLoading: projectsLoading } = trpc.projects.list.useQuery()
  const { data: tasks, isLoading: tasksLoading } = trpc.tasks.list.useQuery(
    { projectPath: selectedProject || undefined },
    { enabled: true }
  )

  const createTask = trpc.tasks.create.useMutation({
    onSuccess: () => {
      utils.tasks.list.invalidate()
      setShowCreateForm(false)
      setForm({ name: '', description: '', branch: '' })
    },
  })

  const updateTask = trpc.tasks.update.useMutation({
    onSuccess: () => {
      utils.tasks.list.invalidate()
      setEditingId(null)
      setForm({ name: '', description: '', branch: '' })
    },
  })

  const deleteTask = trpc.tasks.delete.useMutation({
    onSuccess: () => utils.tasks.list.invalidate(),
  })

  const selectedProjectData = projects?.find((p) => p.path === selectedProject)

  const handleCreateSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.name.trim() || !form.branch.trim() || !selectedProject) return
    createTask.mutate({
      name: form.name.trim(),
      description: form.description.trim(),
      projectName: selectedProjectData?.name ?? selectedProject,
      projectPath: selectedProject,
      branch: form.branch.trim(),
    })
  }

  const handleEditSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!editingId || !form.name.trim()) return
    updateTask.mutate({
      id: editingId,
      name: form.name.trim(),
      description: form.description.trim(),
      branch: form.branch.trim() || undefined,
    })
  }

  const startEdit = (task: { id: number; name: string; description: string; branch: string }) => {
    setEditingId(task.id)
    setForm({ name: task.name, description: task.description, branch: task.branch })
    setShowCreateForm(false)
  }

  const cancelForm = () => {
    setShowCreateForm(false)
    setEditingId(null)
    setForm({ name: '', description: '', branch: '' })
  }

  const grouped = tasks?.reduce<Record<string, typeof tasks>>((acc, task) => {
    const key = task.projectPath
    if (!acc[key]) acc[key] = []
    acc[key].push(task)
    return acc
  }, {}) ?? {}

  const projectNameFor = (path: string) =>
    projects?.find((p) => p.path === path)?.name ?? path.split(/[\\/]/).pop() ?? path

  return (
    <div className="max-w-4xl mx-auto py-8">
      <header className="mb-10 flex items-start justify-between gap-4">
        <div>
          <h1 className="text-4xl md:text-5xl font-bold tracking-tighter text-on-surface mb-2">
            Tasks
          </h1>
          <p className="text-on-surface-variant max-w-md">
            Gerencie as tasks vinculadas aos seus projetos. Uma task representa uma unidade de trabalho que pode ser executada com um workflow.
          </p>
        </div>
        <button
          onClick={() => { setShowCreateForm(true); setEditingId(null) }}
          className="flex items-center gap-2 bg-primary/20 text-primary px-4 py-2.5 rounded-xl hover:bg-primary/30 transition-colors text-sm font-medium flex-shrink-0"
        >
          <Icon name="add" size={18} />
          Nova Task
        </button>
      </header>

      {/* Filter by project */}
      <div className="mb-8 flex items-center gap-3">
        <span className="text-sm text-on-surface-variant">Filtrar por projeto:</span>
        <div className="relative">
          <select
            value={selectedProject}
            onChange={(e) => setSelectedProject(e.target.value)}
            disabled={projectsLoading}
            className="bg-surface-container-low text-on-surface px-3 py-2 pr-8 rounded-lg border-none focus:ring-1 focus:ring-primary/40 appearance-none text-sm cursor-pointer"
          >
            <option value="">Todos os projetos</option>
            {projects?.map((p) => (
              <option key={p.path} value={p.path}>{p.name}</option>
            ))}
          </select>
          <div className="absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none text-on-surface-variant">
            <Icon name="expand_more" size={16} />
          </div>
        </div>
      </div>

      {/* Create Form */}
      {showCreateForm && (
        <div className="bg-surface-container-low rounded-xl border border-primary/20 p-6 mb-8">
          <h3 className="text-sm font-semibold text-on-surface mb-4 flex items-center gap-2">
            <Icon name="add_task" size={16} className="text-primary" />
            Nova Task
          </h3>
          <form onSubmit={handleCreateSubmit} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Project */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-on-surface-variant font-label">Projeto *</label>
                <div className="relative">
                  <select
                    value={selectedProject}
                    onChange={(e) => setSelectedProject(e.target.value)}
                    required
                    className="w-full bg-surface-container text-on-surface px-3 py-3 rounded-lg border-none focus:ring-1 focus:ring-primary/40 appearance-none text-sm cursor-pointer"
                  >
                    <option value="" disabled>Selecione...</option>
                    {projects?.map((p) => (
                      <option key={p.path} value={p.path}>{p.name}</option>
                    ))}
                  </select>
                  <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-on-surface-variant">
                    <Icon name="expand_more" size={14} />
                  </div>
                </div>
              </div>

              {/* Branch */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-on-surface-variant font-label">Branch *</label>
                <input
                  value={form.branch}
                  onChange={(e) => setForm({ ...form, branch: e.target.value })}
                  placeholder="main, develop, feature/..."
                  required
                  className="w-full bg-surface-container text-on-surface px-3 py-3 rounded-lg border-none focus:ring-1 focus:ring-primary/40 text-sm placeholder:text-on-surface-variant/40"
                />
              </div>
            </div>

            {/* Name */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-on-surface-variant font-label">Nome *</label>
              <input
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                placeholder="Nome da task..."
                required
                className="w-full bg-surface-container text-on-surface px-3 py-3 rounded-lg border-none focus:ring-1 focus:ring-primary/40 text-sm placeholder:text-on-surface-variant/40"
              />
            </div>

            {/* Description */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-on-surface-variant font-label">Descrição</label>
              <textarea
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                placeholder="Descrição opcional..."
                rows={2}
                className="w-full bg-surface-container text-on-surface px-3 py-3 rounded-lg border-none focus:ring-1 focus:ring-primary/40 text-sm placeholder:text-on-surface-variant/40 resize-none"
              />
            </div>

            <div className="flex items-center gap-3 pt-1">
              <button
                type="submit"
                disabled={createTask.isPending}
                className="flex items-center gap-1.5 bg-primary/20 text-primary px-4 py-2 rounded-lg text-sm font-medium hover:bg-primary/30 transition-colors disabled:opacity-50"
              >
                {createTask.isPending
                  ? <><Icon name="progress_activity" size={14} className="animate-spin" /> Criando...</>
                  : <><Icon name="check" size={14} /> Criar Task</>
                }
              </button>
              <button
                type="button"
                onClick={cancelForm}
                className="text-on-surface-variant hover:text-on-surface text-sm px-3 py-2 rounded-lg transition-colors"
              >
                Cancelar
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Task List */}
      {tasksLoading ? (
        <div className="space-y-3 animate-pulse">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-20 bg-surface-container rounded-xl" />
          ))}
        </div>
      ) : !tasks || tasks.length === 0 ? (
        <div className="text-center py-24 text-on-surface-variant">
          <Icon name="task_alt" size={40} className="mx-auto mb-4 opacity-30" />
          <p className="text-sm">Nenhuma task encontrada.</p>
          <button
            onClick={() => setShowCreateForm(true)}
            className="mt-4 text-primary text-sm underline hover:no-underline"
          >
            Criar a primeira task
          </button>
        </div>
      ) : (
        <div className="space-y-8">
          {Object.entries(grouped).map(([projectPath, projectTasks]) => (
            <div key={projectPath}>
              <div className="flex items-center gap-2 mb-3">
                <Icon name="folder" size={14} className="text-on-surface-variant/60" />
                <span className="text-xs font-bold text-on-surface-variant uppercase tracking-widest">
                  {projectNameFor(projectPath)}
                </span>
                <span className="text-[10px] text-on-surface-variant/50 font-mono truncate max-w-xs">
                  {projectPath}
                </span>
              </div>
              <div className="space-y-2">
                {projectTasks.map((task) => (
                  <div
                    key={task.id}
                    className="bg-surface-container-low rounded-xl border border-white/5 overflow-hidden"
                  >
                    {editingId === task.id ? (
                      <form onSubmit={handleEditSubmit} className="p-4 space-y-3">
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          <input
                            value={form.name}
                            onChange={(e) => setForm({ ...form, name: e.target.value })}
                            placeholder="Nome *"
                            required
                            className="bg-surface-container text-on-surface px-3 py-2 rounded-lg border-none focus:ring-1 focus:ring-primary/40 text-sm"
                          />
                          <input
                            value={form.branch}
                            onChange={(e) => setForm({ ...form, branch: e.target.value })}
                            placeholder="Branch"
                            className="bg-surface-container text-on-surface px-3 py-2 rounded-lg border-none focus:ring-1 focus:ring-primary/40 text-sm"
                          />
                        </div>
                        <textarea
                          value={form.description}
                          onChange={(e) => setForm({ ...form, description: e.target.value })}
                          placeholder="Descrição"
                          rows={2}
                          className="w-full bg-surface-container text-on-surface px-3 py-2 rounded-lg border-none focus:ring-1 focus:ring-primary/40 text-sm resize-none"
                        />
                        <div className="flex items-center gap-2">
                          <button
                            type="submit"
                            disabled={updateTask.isPending}
                            className="flex items-center gap-1.5 bg-primary/20 text-primary px-3 py-1.5 rounded-lg text-xs font-medium hover:bg-primary/30 transition-colors disabled:opacity-50"
                          >
                            {updateTask.isPending ? <Icon name="progress_activity" size={12} className="animate-spin" /> : <Icon name="check" size={12} />}
                            Salvar
                          </button>
                          <button
                            type="button"
                            onClick={cancelForm}
                            className="text-on-surface-variant text-xs px-3 py-1.5 rounded-lg hover:bg-surface-container transition-colors"
                          >
                            Cancelar
                          </button>
                        </div>
                      </form>
                    ) : (
                      <div className="flex items-start justify-between gap-4 p-4">
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2 mb-0.5">
                            <Icon name="task_alt" size={14} className="text-primary/60 flex-shrink-0" />
                            <p className="text-sm font-medium text-on-surface truncate">{task.name}</p>
                          </div>
                          {task.description && (
                            <p className="text-xs text-on-surface-variant line-clamp-2 ml-5">{task.description}</p>
                          )}
                          <div className="flex items-center gap-3 mt-2 ml-5">
                            <div className="flex items-center gap-1 text-xs text-on-surface-variant/60">
                              <Icon name="account_tree" size={11} />
                              <span>{task.branch}</span>
                            </div>
                            <span className="text-[10px] text-on-surface-variant/40">
                              {new Date(task.createdAt).toLocaleDateString('pt-BR')}
                            </span>
                          </div>
                        </div>
                        <div className="flex items-center gap-1 flex-shrink-0">
                          <button
                            onClick={() => navigate(`/run/new`)}
                            title="Executar task"
                            className="p-2 text-on-surface-variant/60 hover:text-primary rounded-lg hover:bg-primary/10 transition-colors"
                          >
                            <Icon name="play_arrow" size={16} />
                          </button>
                          <button
                            onClick={() => startEdit(task)}
                            title="Editar"
                            className="p-2 text-on-surface-variant/60 hover:text-on-surface rounded-lg hover:bg-surface-container transition-colors"
                          >
                            <Icon name="edit" size={16} />
                          </button>
                          <button
                            onClick={() => deleteTask.mutate({ id: task.id })}
                            title="Excluir"
                            disabled={deleteTask.isPending}
                            className="p-2 text-on-surface-variant/60 hover:text-error rounded-lg hover:bg-error/10 transition-colors disabled:opacity-50"
                          >
                            <Icon name="delete" size={16} />
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
