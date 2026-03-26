import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { trpc } from '../trpc'
import { Icon } from '../components/ui/Icon'

export function WorkflowsPage() {
  const navigate = useNavigate()
  const [showCreate, setShowCreate] = useState(false)
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')

  const utils = trpc.useUtils()
  const { data: workflows, isLoading } = trpc.workflows.list.useQuery()

  const createWorkflow = trpc.workflows.create.useMutation({
    onSuccess: (wf) => {
      utils.workflows.list.invalidate()
      setShowCreate(false)
      setName('')
      setDescription('')
      navigate(`/workflows/${wf.id}`)
    },
  })

  const deleteWorkflow = trpc.workflows.delete.useMutation({
    onSuccess: () => utils.workflows.list.invalidate(),
  })

  return (
    <div className="max-w-5xl mx-auto py-8">
      <header className="flex items-center justify-between mb-10">
        <div>
          <h1 className="text-4xl font-bold font-space-grotesk tracking-tight text-white mb-2">
            Work<span className="text-tertiary">flows</span>
          </h1>
          <p className="text-on-surface-variant font-body">
            Componha pipelines visuais conectando nodes em sequência.
          </p>
        </div>
        <button
          onClick={() => setShowCreate(!showCreate)}
          className="flex items-center gap-2 px-5 py-2.5 bg-tertiary text-on-tertiary rounded-xl text-sm font-medium hover:brightness-110 active:scale-95 transition-all"
        >
          <Icon name={showCreate ? 'close' : 'add'} size={18} />
          {showCreate ? 'Cancelar' : 'Novo Workflow'}
        </button>
      </header>

      {/* Quick Create */}
      {showCreate && (
        <form
          onSubmit={(e) => { e.preventDefault(); if (name.trim()) createWorkflow.mutate({ name, description }) }}
          className="glass-effect rounded-xl p-5 border border-white/5 mb-8 flex flex-col sm:flex-row gap-3"
        >
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Nome do workflow"
            className="flex-1 bg-surface-container-low text-on-surface px-3 py-2.5 rounded-xl border-none focus:ring-1 focus:ring-tertiary/40 text-sm"
            autoFocus
          />
          <input
            type="text"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Descrição (opcional)"
            className="flex-1 bg-surface-container-low text-on-surface px-3 py-2.5 rounded-xl border-none focus:ring-1 focus:ring-tertiary/40 text-sm"
          />
          <button
            type="submit"
            disabled={createWorkflow.isPending}
            className="px-5 py-2.5 bg-tertiary text-on-tertiary rounded-xl text-sm font-medium hover:brightness-110 active:scale-95 transition-all disabled:opacity-50 whitespace-nowrap"
          >
            Criar
          </button>
        </form>
      )}

      {/* Workflows List */}
      {isLoading ? (
        <div className="space-y-4">
          {[1, 2].map((i) => (
            <div key={i} className="glass-effect rounded-xl p-6 border border-white/5 animate-pulse">
              <div className="h-5 bg-surface-container-high rounded w-1/3 mb-3" />
              <div className="h-3 bg-surface-container rounded w-1/2" />
            </div>
          ))}
        </div>
      ) : !workflows || workflows.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-24 text-center">
          <div className="w-16 h-16 rounded-full bg-surface-container-high flex items-center justify-center mb-6">
            <Icon name="account_tree" size={32} className="text-on-surface-variant" />
          </div>
          <h2 className="text-lg font-semibold text-on-surface mb-2 font-space-grotesk">
            Nenhum workflow ainda
          </h2>
          <p className="text-on-surface-variant text-sm mb-6 max-w-xs">
            Crie um workflow para conectar seus nodes AI em pipeline.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {workflows.map((wf) => (
            <div
              key={wf.id}
              onClick={() => navigate(`/workflows/${wf.id}`)}
              className="glass-effect rounded-xl p-5 border border-white/5 cursor-pointer hover:border-tertiary/20 transition-all group"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-lg bg-tertiary/10 flex items-center justify-center">
                    <Icon name="account_tree" className="text-tertiary" />
                  </div>
                  <div>
                    <h3 className="text-base font-bold font-space-grotesk text-on-surface group-hover:text-tertiary transition-colors">
                      {wf.name}
                    </h3>
                    {wf.description && (
                      <p className="text-xs text-on-surface-variant mt-0.5">{wf.description}</p>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-2">
                    <Icon name="lan" size={16} className="text-on-surface-variant" />
                    <span className="text-xs font-bold text-on-surface-variant">
                      {wf.stepCount} {wf.stepCount === 1 ? 'node' : 'nodes'}
                    </span>
                  </div>
                  <button
                    onClick={(e) => { e.stopPropagation(); deleteWorkflow.mutate({ id: wf.id }) }}
                    className="p-1.5 rounded-lg opacity-0 group-hover:opacity-100 bg-surface-container-high hover:bg-error/10 text-on-surface-variant hover:text-error transition-all"
                  >
                    <Icon name="delete" size={16} />
                  </button>
                  <Icon name="chevron_right" className="text-on-surface-variant group-hover:text-tertiary transition-colors" />
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
