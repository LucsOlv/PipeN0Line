import { useParams, useNavigate } from 'react-router-dom'
import { useState } from 'react'
import { trpc } from '../trpc'
import { Icon } from '../components/ui/Icon'

function Connector() {
  return (
    <svg width="48" height="24" viewBox="0 0 48 24" className="shrink-0 mx-[-4px]">
      <defs>
        <linearGradient id="connGrad" x1="0" x2="1" y1="0" y2="0">
          <stop offset="0%" stopColor="#9ba8ff" stopOpacity="0.6" />
          <stop offset="100%" stopColor="#ffa4e4" stopOpacity="0.6" />
        </linearGradient>
      </defs>
      <line x1="0" y1="12" x2="36" y2="12" stroke="url(#connGrad)" strokeWidth="2" strokeDasharray="4 3" />
      <polygon points="36,6 48,12 36,18" fill="#ffa4e4" opacity="0.7" />
    </svg>
  )
}

interface WorkflowStep {
  id: number
  nodeId: number
  position: number
  config: string | null
  node: {
    id: number
    name: string
    description: string
    model: string
    systemPrompt: string
    inputType: string
    outputType: string
    color: string
    icon: string
  }
}

function StepCard({
  step,
  onRemove,
  onMoveLeft,
  onMoveRight,
  isFirst,
  isLast,
}: {
  step: WorkflowStep
  onRemove: () => void
  onMoveLeft: () => void
  onMoveRight: () => void
  isFirst: boolean
  isLast: boolean
}) {
  const { node } = step

  return (
    <div
      className="relative glass-effect rounded-xl p-4 border-2 min-w-[180px] max-w-[220px] shrink-0 group hover:shadow-lg transition-all"
      style={{ borderColor: node.color + '55' }}
    >
      {/* Glow on hover */}
      <div
        className="absolute inset-0 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity -z-10 blur-xl"
        style={{ backgroundColor: node.color + '15' }}
      />

      {/* Header */}
      <div className="flex items-center gap-2 mb-3">
        <div
          className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0"
          style={{ backgroundColor: node.color + '22' }}
        >
          <Icon name={node.icon} size={18} className="text-white" />
        </div>
        <div className="min-w-0">
          <h4 className="text-sm font-bold font-space-grotesk text-on-surface truncate">{node.name}</h4>
          <p className="text-[10px] text-on-surface-variant truncate">{node.model}</p>
        </div>
      </div>

      {/* I/O badges */}
      <div className="flex gap-1.5 mb-3">
        <span className="text-[9px] px-1.5 py-0.5 rounded bg-primary/10 text-primary font-bold uppercase">
          in:{node.inputType}
        </span>
        <span className="text-[9px] px-1.5 py-0.5 rounded bg-tertiary/10 text-tertiary font-bold uppercase">
          out:{node.outputType}
        </span>
      </div>

      {/* Position badge */}
      <div className="absolute -top-2 -left-2 w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold text-white"
        style={{ backgroundColor: node.color }}
      >
        {step.position + 1}
      </div>

      {/* Actions */}
      <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity mt-2 justify-between">
        <div className="flex gap-1">
          <button
            onClick={onMoveLeft}
            disabled={isFirst}
            className="p-1 rounded bg-surface-container-high hover:bg-surface-container-highest text-on-surface-variant disabled:opacity-20 transition-colors"
          >
            <Icon name="chevron_left" size={14} />
          </button>
          <button
            onClick={onMoveRight}
            disabled={isLast}
            className="p-1 rounded bg-surface-container-high hover:bg-surface-container-highest text-on-surface-variant disabled:opacity-20 transition-colors"
          >
            <Icon name="chevron_right" size={14} />
          </button>
        </div>
        <button
          onClick={onRemove}
          className="p-1 rounded bg-surface-container-high hover:bg-error/10 text-on-surface-variant hover:text-error transition-colors"
        >
          <Icon name="close" size={14} />
        </button>
      </div>
    </div>
  )
}

function NodeToolboxItem({
  node,
  onAdd,
}: {
  node: { id: number; name: string; icon: string; color: string; model: string; inputType: string; outputType: string }
  onAdd: () => void
}) {
  return (
    <button
      onClick={onAdd}
      className="flex items-center gap-2.5 w-full p-2.5 rounded-xl hover:bg-surface-container-highest transition-colors text-left group/item"
    >
      <div
        className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0"
        style={{ backgroundColor: node.color + '22' }}
      >
        <Icon name={node.icon} size={16} className="text-white" />
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-xs font-bold text-on-surface truncate group-hover/item:text-primary transition-colors">{node.name}</p>
        <p className="text-[10px] text-on-surface-variant">{node.model}</p>
      </div>
      <Icon name="add_circle" size={18} className="text-on-surface-variant opacity-0 group-hover/item:opacity-100 transition-opacity shrink-0" />
    </button>
  )
}

export function WorkflowEditorPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const workflowId = Number(id)
  const [isEditingName, setIsEditingName] = useState(false)
  const [editName, setEditName] = useState('')

  const utils = trpc.useUtils()
  const { data: workflow, isLoading } = trpc.workflows.get.useQuery(
    { id: workflowId },
    { enabled: !isNaN(workflowId) }
  )
  const { data: allNodes } = trpc.nodes.list.useQuery()

  const updateWorkflow = trpc.workflows.update.useMutation({
    onSuccess: () => { utils.workflows.get.invalidate({ id: workflowId }); setIsEditingName(false) },
  })

  const addStep = trpc.workflows.addStep.useMutation({
    onSuccess: () => utils.workflows.get.invalidate({ id: workflowId }),
  })

  const removeStep = trpc.workflows.removeStep.useMutation({
    onSuccess: () => utils.workflows.get.invalidate({ id: workflowId }),
  })

  const reorderSteps = trpc.workflows.reorderSteps.useMutation({
    onSuccess: () => utils.workflows.get.invalidate({ id: workflowId }),
  })

  const handleReorder = (stepId: number, direction: -1 | 1) => {
    if (!workflow?.steps) return
    const steps = [...workflow.steps]
    const idx = steps.findIndex((s) => s.id === stepId)
    if (idx < 0) return
    const targetIdx = idx + direction
    if (targetIdx < 0 || targetIdx >= steps.length) return
    ;[steps[idx], steps[targetIdx]] = [steps[targetIdx], steps[idx]]
    reorderSteps.mutate({ workflowId, stepIds: steps.map((s) => s.id) })
  }

  const startNameEdit = () => {
    setEditName(workflow?.name ?? '')
    setIsEditingName(true)
  }

  const saveName = () => {
    if (editName.trim()) {
      updateWorkflow.mutate({ id: workflowId, name: editName.trim() })
    } else {
      setIsEditingName(false)
    }
  }

  if (isLoading) {
    return (
      <div className="max-w-6xl mx-auto py-8">
        <div className="animate-pulse space-y-6">
          <div className="h-8 bg-surface-container-high rounded-xl w-1/3" />
          <div className="h-40 bg-surface-container rounded-xl" />
        </div>
      </div>
    )
  }

  if (!workflow) {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-center">
        <p className="text-on-surface-variant">Workflow não encontrado.</p>
        <button onClick={() => navigate('/workflows')} className="text-primary text-sm mt-4 hover:underline">
          Voltar para Workflows
        </button>
      </div>
    )
  }

  const steps = (workflow.steps ?? []) as WorkflowStep[]

  return (
    <div className="max-w-[100rem] mx-auto py-8">
      {/* Top bar */}
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-4">
          <button
            onClick={() => navigate('/workflows')}
            className="flex items-center gap-2 text-on-surface-variant hover:text-primary transition-colors group"
          >
            <Icon name="arrow_back" className="text-sm group-hover:-translate-x-1 transition-transform" />
          </button>

          {isEditingName ? (
            <form
              onSubmit={(e) => { e.preventDefault(); saveName() }}
              className="flex items-center gap-2"
            >
              <input
                type="text"
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
                className="bg-surface-container-low text-on-surface px-3 py-1.5 rounded-xl border-none focus:ring-1 focus:ring-primary/40 text-xl font-bold font-space-grotesk"
                autoFocus
                onBlur={saveName}
              />
            </form>
          ) : (
            <h1
              onClick={startNameEdit}
              className="text-2xl font-bold font-space-grotesk text-on-surface cursor-pointer hover:text-primary transition-colors"
            >
              {workflow.name}
              <Icon name="edit" size={16} className="ml-2 text-on-surface-variant opacity-40" />
            </h1>
          )}
        </div>

        <div className="flex items-center gap-2 text-xs text-on-surface-variant">
          <Icon name="lan" size={16} />
          <span className="font-bold">{steps.length} nodes</span>
        </div>
      </div>

      <div className="flex gap-6">
        {/* Canvas */}
        <div className="flex-1 min-w-0">
          <div className="glass-effect rounded-xl border border-white/5 p-6 min-h-[400px]">
            {steps.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 text-center">
                <div className="w-16 h-16 rounded-full bg-surface-container-high flex items-center justify-center mb-4">
                  <Icon name="add_circle" size={32} className="text-on-surface-variant" />
                </div>
                <p className="text-on-surface-variant text-sm mb-2">
                  Pipeline vazio
                </p>
                <p className="text-on-surface-variant text-xs opacity-60">
                  Adicione nodes do painel lateral para construir o workflow.
                </p>
              </div>
            ) : (
              <div className="flex items-center gap-0 overflow-x-auto pb-4 custom-scrollbar">
                {steps.map((step, i) => (
                  <div key={step.id} className="flex items-center">
                    <StepCard
                      step={step}
                      onRemove={() => removeStep.mutate({ stepId: step.id })}
                      onMoveLeft={() => handleReorder(step.id, -1)}
                      onMoveRight={() => handleReorder(step.id, 1)}
                      isFirst={i === 0}
                      isLast={i === steps.length - 1}
                    />
                    {i < steps.length - 1 && <Connector />}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Flow description */}
          {steps.length >= 2 && (
            <div className="mt-4 glass-effect rounded-xl border border-white/5 p-4">
              <h3 className="text-xs font-bold text-on-surface-variant uppercase tracking-widest mb-2 flex items-center gap-2">
                <Icon name="arrow_right_alt" size={16} />
                Fluxo de dados
              </h3>
              <div className="flex flex-wrap items-center gap-1 text-xs text-on-surface-variant">
                {steps.map((step, i) => (
                  <span key={step.id} className="flex items-center gap-1">
                    <span className="font-bold" style={{ color: step.node.color }}>{step.node.name}</span>
                    <span className="text-[10px] opacity-50">({step.node.outputType})</span>
                    {i < steps.length - 1 && <Icon name="east" size={14} className="mx-1 opacity-40" />}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Toolbox Sidebar */}
        <div className="w-64 shrink-0">
          <div className="glass-effect rounded-xl border border-white/5 p-4 sticky top-24">
            <h3 className="text-xs font-bold text-on-surface-variant uppercase tracking-widest mb-3 flex items-center gap-2">
              <Icon name="widgets" size={16} />
              Nodes Disponíveis
            </h3>

            {!allNodes || allNodes.length === 0 ? (
              <div className="text-center py-6">
                <p className="text-xs text-on-surface-variant mb-2">Nenhum node criado.</p>
                <button
                  onClick={() => navigate('/nodes')}
                  className="text-xs text-primary hover:underline"
                >
                  Criar nodes →
                </button>
              </div>
            ) : (
              <div className="space-y-1 max-h-[60vh] overflow-y-auto custom-scrollbar">
                {allNodes.map((node) => (
                  <NodeToolboxItem
                    key={node.id}
                    node={node}
                    onAdd={() => addStep.mutate({ workflowId, nodeId: node.id })}
                  />
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
