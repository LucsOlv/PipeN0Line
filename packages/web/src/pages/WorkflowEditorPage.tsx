import { useParams, useNavigate } from 'react-router-dom'
import { useState, useRef, useCallback } from 'react'
import { trpc } from '../trpc'
import { Icon } from '../components/ui/Icon'

const PORT_TYPES = ['text', 'json', 'code', 'files', 'number', 'boolean'] as const
type PortType = (typeof PORT_TYPES)[number]

interface IOPort {
  key: string
  label: string
  type: PortType
  required: boolean
}

interface Binding {
  source: 'task' | 'step'
  field: string
  stepPosition?: number
}

interface StepConfig {
  bindings: Record<string, Binding>
}

interface WorkflowStep {
  id: number
  nodeId: number
  position: number
  config: StepConfig | null
  node: {
    id: number
    name: string
    description: string
    model: string
    systemPrompt: string
    inputType: string
    outputType: string
    inputPorts: IOPort[]
    outputPorts: IOPort[]
    color: string
    icon: string
  }
}

const TASK_OUTPUTS: IOPort[] = [
  { key: 'files', label: 'Arquivos do Projeto', type: 'files', required: true },
  { key: 'project_name', label: 'Nome do Projeto', type: 'text', required: true },
  { key: 'branch', label: 'Branch', type: 'text', required: true },
  { key: 'project_path', label: 'Caminho do Projeto', type: 'text', required: true },
]

const PORT_COLOR: Record<PortType, string> = {
  text: '#9ba8ff',
  json: '#9891fe',
  code: '#34d399',
  files: '#fb923c',
  number: '#ffa4e4',
  boolean: '#94a3b8',
}

const TYPE_COMPAT: Record<PortType, PortType[]> = {
  text: ['text', 'code', 'json'],
  json: ['json', 'text'],
  code: ['code', 'text'],
  files: ['files', 'text'],
  number: ['number', 'text'],
  boolean: ['boolean', 'text'],
}

function areCompatible(outType: PortType, inType: PortType): boolean {
  return TYPE_COMPAT[outType]?.includes(inType) ?? false
}

interface DragState {
  sourceType: 'task' | 'step'
  sourceStepPosition?: number
  sourcePortKey: string
  sourcePortType: PortType
  mouseX: number
  mouseY: number
  startX: number
  startY: number
}

// --- Task Node (start) ---
function TaskNode({
  onPortDragStart,
}: {
  onPortDragStart: (portKey: string, portType: PortType, e: React.MouseEvent) => void
}) {
  return (
    <div className="relative glass-effect rounded-xl p-4 border-2 border-emerald-500/40 min-w-[180px] shrink-0">
      <div className="absolute -top-2 -left-2 w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold text-white bg-emerald-500">
        T
      </div>
      <div className="flex items-center gap-2 mb-3">
        <div className="w-8 h-8 rounded-lg flex items-center justify-center bg-emerald-500/20">
          <Icon name="assignment" size={18} className="text-emerald-400" />
        </div>
        <div>
          <h4 className="text-sm font-bold font-space-grotesk text-on-surface">Task</h4>
          <p className="text-[10px] text-on-surface-variant">Dados do Run</p>
        </div>
      </div>

      {/* Output ports */}
      <div className="space-y-1.5">
        {TASK_OUTPUTS.map((port) => (
          <div
            key={port.key}
            className="flex items-center gap-2 group/port cursor-grab active:cursor-grabbing"
            onMouseDown={(e) => onPortDragStart(port.key, port.type, e)}
          >
            <span className="text-[10px] text-on-surface flex-1 truncate">{port.label}</span>
            <span className="text-[8px] text-on-surface-variant">{port.type}</span>
            <div
              className="w-3 h-3 rounded-full border-2 transition-transform group-hover/port:scale-125 flex-shrink-0"
              style={{ borderColor: PORT_COLOR[port.type], backgroundColor: PORT_COLOR[port.type] + '40' }}
              data-port-id={`task-out-${port.key}`}
            />
          </div>
        ))}
      </div>
    </div>
  )
}

// --- Step Node Card ---
function StepNode({
  step,
  onRemove,
  onMoveLeft,
  onMoveRight,
  isFirst,
  isLast,
  onOutputDragStart,
  onInputDrop,
  dragState,
}: {
  step: WorkflowStep
  onRemove: () => void
  onMoveLeft: () => void
  onMoveRight: () => void
  isFirst: boolean
  isLast: boolean
  onOutputDragStart: (portKey: string, portType: PortType, e: React.MouseEvent) => void
  onInputDrop: (portKey: string) => void
  dragState: DragState | null
}) {
  const { node } = step
  const bindings = step.config?.bindings ?? {}

  return (
    <div
      className="relative glass-effect rounded-xl p-4 border-2 min-w-[200px] max-w-[240px] shrink-0 group hover:shadow-lg transition-all"
      style={{ borderColor: node.color + '55' }}
    >
      <div
        className="absolute inset-0 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity -z-10 blur-xl"
        style={{ backgroundColor: node.color + '15' }}
      />

      <div className="absolute -top-2 -left-2 w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold text-white"
        style={{ backgroundColor: node.color }}
      >
        {step.position + 1}
      </div>

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

      {/* Input ports (left side) */}
      <div className="mb-2">
        <p className="text-[9px] text-on-surface-variant font-bold uppercase tracking-widest mb-1">IN</p>
        <div className="space-y-1">
          {node.inputPorts.map((port) => {
            const binding = bindings[port.key]
            const isDropTarget = dragState && areCompatible(dragState.sourcePortType, port.type)
            return (
              <div
                key={port.key}
                className={`flex items-center gap-2 rounded px-1 py-0.5 transition-colors ${
                  isDropTarget ? 'bg-primary/10 ring-1 ring-primary/30' : ''
                }`}
                onMouseUp={() => {
                  if (dragState && areCompatible(dragState.sourcePortType, port.type)) {
                    onInputDrop(port.key)
                  }
                }}
              >
                <div
                  className="w-3 h-3 rounded-full border-2 flex-shrink-0"
                  style={{
                    borderColor: PORT_COLOR[port.type],
                    backgroundColor: binding ? PORT_COLOR[port.type] + '80' : 'transparent',
                  }}
                  data-port-id={`step-${step.position}-in-${port.key}`}
                />
                <span className="text-[10px] text-on-surface flex-1 truncate">{port.label}</span>
                {binding ? (
                  <span className="text-[8px] text-primary font-mono truncate max-w-[80px]">
                    {binding.source === 'task' ? `task.${binding.field}` : `step${binding.stepPosition}.${binding.field}`}
                  </span>
                ) : (
                  <span className="text-[8px] text-on-surface-variant italic">vazio</span>
                )}
              </div>
            )
          })}
        </div>
      </div>

      {/* Output ports (right side) */}
      <div>
        <p className="text-[9px] text-on-surface-variant font-bold uppercase tracking-widest mb-1">OUT</p>
        <div className="space-y-1">
          {node.outputPorts.map((port) => (
            <div
              key={port.key}
              className="flex items-center gap-2 group/port cursor-grab active:cursor-grabbing"
              onMouseDown={(e) => onOutputDragStart(port.key, port.type, e)}
            >
              <span className="text-[10px] text-on-surface flex-1 truncate">{port.label}</span>
              <span className="text-[8px] text-on-surface-variant">{port.type}</span>
              <div
                className="w-3 h-3 rounded-full border-2 transition-transform group-hover/port:scale-125 flex-shrink-0"
                style={{ borderColor: PORT_COLOR[port.type], backgroundColor: PORT_COLOR[port.type] + '40' }}
                data-port-id={`step-${step.position}-out-${port.key}`}
              />
            </div>
          ))}
        </div>
      </div>

      {/* Actions */}
      <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity mt-3 justify-between">
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

function NodeToolboxItem({
  node,
  onAdd,
}: {
  node: { id: number; name: string; icon: string; color: string; model: string; inputPorts: IOPort[]; outputPorts: IOPort[] }
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
        <div className="flex gap-1 mt-0.5">
          {node.inputPorts.slice(0, 2).map((p) => (
            <span key={p.key} className="text-[8px] px-1 rounded" style={{ backgroundColor: PORT_COLOR[p.type] + '20', color: PORT_COLOR[p.type] }}>
              {p.type}
            </span>
          ))}
          <span className="text-[8px] text-on-surface-variant">→</span>
          {node.outputPorts.slice(0, 2).map((p) => (
            <span key={p.key} className="text-[8px] px-1 rounded" style={{ backgroundColor: PORT_COLOR[p.type] + '20', color: PORT_COLOR[p.type] }}>
              {p.type}
            </span>
          ))}
        </div>
      </div>
      <Icon name="add_circle" size={18} className="text-on-surface-variant opacity-0 group-hover/item:opacity-100 transition-opacity shrink-0" />
    </button>
  )
}

// --- Connection Lines SVG overlay ---
function ConnectionLines({ steps }: { steps: WorkflowStep[] }) {
  const lines: { fromPort: string; toPort: string; color: string }[] = []

  for (const step of steps) {
    const bindings = step.config?.bindings ?? {}
    for (const [inputKey, binding] of Object.entries(bindings)) {
      const inputPort = step.node.inputPorts.find((p) => p.key === inputKey)
      if (!inputPort) continue

      const fromId = binding.source === 'task'
        ? `task-out-${binding.field}`
        : `step-${binding.stepPosition}-out-${binding.field}`
      const toId = `step-${step.position}-in-${inputKey}`

      lines.push({ fromPort: fromId, toPort: toId, color: PORT_COLOR[inputPort.type] })
    }
  }

  if (lines.length === 0) return null

  return (
    <svg className="absolute inset-0 w-full h-full pointer-events-none z-10" style={{ overflow: 'visible' }}>
      {lines.map((line, i) => {
        const fromEl = document.querySelector(`[data-port-id="${line.fromPort}"]`)
        const toEl = document.querySelector(`[data-port-id="${line.toPort}"]`)
        if (!fromEl || !toEl) return null

        const container = fromEl.closest('.canvas-container')
        if (!container) return null

        const containerRect = container.getBoundingClientRect()
        const fromRect = fromEl.getBoundingClientRect()
        const toRect = toEl.getBoundingClientRect()

        const x1 = fromRect.left + fromRect.width / 2 - containerRect.left
        const y1 = fromRect.top + fromRect.height / 2 - containerRect.top
        const x2 = toRect.left + toRect.width / 2 - containerRect.left
        const y2 = toRect.top + toRect.height / 2 - containerRect.top

        const cpx = Math.abs(x2 - x1) * 0.4

        return (
          <path
            key={i}
            d={`M ${x1} ${y1} C ${x1 + cpx} ${y1}, ${x2 - cpx} ${y2}, ${x2} ${y2}`}
            fill="none"
            stroke={line.color}
            strokeWidth="2"
            strokeOpacity="0.5"
          />
        )
      })}
    </svg>
  )
}

export function WorkflowEditorPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const workflowId = Number(id)
  const [isEditingName, setIsEditingName] = useState(false)
  const [editName, setEditName] = useState('')
  const [dragState, setDragState] = useState<DragState | null>(null)
  const canvasRef = useRef<HTMLDivElement>(null)

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

  const updateStepConfig = trpc.workflows.updateStepConfig.useMutation({
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

  // Drag handling for port connections
  const handlePortDragStart = useCallback((
    sourceType: 'task' | 'step',
    sourceStepPosition: number | undefined,
    portKey: string,
    portType: PortType,
    e: React.MouseEvent,
  ) => {
    e.preventDefault()
    // Find the actual dot element within the row, not whatever text/span was clicked
    const row = e.currentTarget as HTMLElement
    const dot = row.querySelector('[data-port-id]') as HTMLElement | null
    const rect = dot ? dot.getBoundingClientRect() : row.getBoundingClientRect()
    setDragState({
      sourceType,
      sourceStepPosition,
      sourcePortKey: portKey,
      sourcePortType: portType,
      mouseX: e.clientX,
      mouseY: e.clientY,
      startX: rect.left + rect.width / 2,
      startY: rect.top + rect.height / 2,
    })
  }, [])

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    setDragState((prev) => prev ? { ...prev, mouseX: e.clientX, mouseY: e.clientY } : null)
  }, [])

  const handleMouseUp = useCallback(() => {
    setDragState(null)
  }, [])

  const handleInputDrop = useCallback((step: WorkflowStep, inputPortKey: string) => {
    if (!dragState) return
    const currentBindings = step.config?.bindings ?? {}
    const newBindings = {
      ...currentBindings,
      [inputPortKey]: {
        source: dragState.sourceType,
        field: dragState.sourcePortKey,
        ...(dragState.sourceStepPosition !== undefined ? { stepPosition: dragState.sourceStepPosition } : {}),
      },
    }
    updateStepConfig.mutate({
      stepId: step.id,
      config: { bindings: newBindings },
    })
    setDragState(null)
  }, [dragState, updateStepConfig])

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
    <div
      className="max-w-[100rem] mx-auto py-8"
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
    >
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

        <div className="flex items-center gap-4">
          {/* Port type legend */}
          <div className="flex items-center gap-3">
            {PORT_TYPES.map((t) => (
              <div key={t} className="flex items-center gap-1">
                <div className="w-2 h-2 rounded-full" style={{ backgroundColor: PORT_COLOR[t] }} />
                <span className="text-[9px] text-on-surface-variant uppercase">{t}</span>
              </div>
            ))}
          </div>

          <div className="flex items-center gap-2 text-xs text-on-surface-variant">
            <Icon name="lan" size={16} />
            <span className="font-bold">{steps.length} nodes</span>
          </div>
        </div>
      </div>

      <div className="flex gap-6">
        {/* Canvas */}
        <div className="flex-1 min-w-0">
          <div
            ref={canvasRef}
            className="canvas-container glass-effect rounded-xl border border-white/5 p-6 min-h-[400px] relative"
          >
            {steps.length === 0 ? (
              <div className="flex items-center gap-0 overflow-x-auto pb-4 custom-scrollbar">
                <TaskNode
                  onPortDragStart={(portKey, portType, e) =>
                    handlePortDragStart('task', undefined, portKey, portType, e)
                  }
                />
                <Connector />
                <div className="flex flex-col items-center justify-center py-8 px-12 text-center border-2 border-dashed border-white/10 rounded-xl">
                  <Icon name="add_circle" size={24} className="text-on-surface-variant mb-2" />
                  <p className="text-on-surface-variant text-xs">Adicione nodes</p>
                </div>
              </div>
            ) : (
              <>
                <ConnectionLines steps={steps} />
                <div className="flex items-start gap-0 overflow-x-auto pb-4 custom-scrollbar relative">
                  <TaskNode
                    onPortDragStart={(portKey, portType, e) =>
                      handlePortDragStart('task', undefined, portKey, portType, e)
                    }
                  />
                  <Connector />
                  {steps.map((step, i) => (
                    <div key={step.id} className="flex items-center">
                      <StepNode
                        step={step}
                        onRemove={() => removeStep.mutate({ stepId: step.id })}
                        onMoveLeft={() => handleReorder(step.id, -1)}
                        onMoveRight={() => handleReorder(step.id, 1)}
                        isFirst={i === 0}
                        isLast={i === steps.length - 1}
                        onOutputDragStart={(portKey, portType, e) =>
                          handlePortDragStart('step', step.position, portKey, portType, e)
                        }
                        onInputDrop={(portKey) => handleInputDrop(step, portKey)}
                        dragState={dragState}
                      />
                      {i < steps.length - 1 && <Connector />}
                    </div>
                  ))}
                </div>
              </>
            )}

            {/* Drag line overlay */}
            {dragState && (
              <svg
                className="pointer-events-none"
                style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', zIndex: 9999 }}
              >
                <line
                  x1={dragState.startX}
                  y1={dragState.startY}
                  x2={dragState.mouseX}
                  y2={dragState.mouseY}
                  stroke={PORT_COLOR[dragState.sourcePortType]}
                  strokeWidth="2"
                  strokeDasharray="6 3"
                  strokeOpacity="0.8"
                />
                <circle cx={dragState.mouseX} cy={dragState.mouseY} r="4" fill={PORT_COLOR[dragState.sourcePortType]} />
              </svg>
            )}
          </div>

          {/* Bindings summary */}
          {steps.some((s) => Object.keys(s.config?.bindings ?? {}).length > 0) && (
            <div className="mt-4 glass-effect rounded-xl border border-white/5 p-4">
              <h3 className="text-xs font-bold text-on-surface-variant uppercase tracking-widest mb-3 flex items-center gap-2">
                <Icon name="cable" size={16} />
                Conexões
              </h3>
              <div className="space-y-1.5">
                {steps.map((step) => {
                  const bindings = step.config?.bindings ?? {}
                  return Object.entries(bindings).map(([inputKey, binding]) => (
                    <div key={`${step.id}-${inputKey}`} className="flex items-center gap-2 text-xs">
                      <span className="text-on-surface-variant font-mono">
                        {binding.source === 'task' ? 'task' : `step[${binding.stepPosition}]`}.{binding.field}
                      </span>
                      <Icon name="east" size={12} className="text-on-surface-variant/40" />
                      <span className="font-bold" style={{ color: step.node.color }}>
                        {step.node.name}
                      </span>
                      <span className="text-on-surface-variant">.{inputKey}</span>
                    </div>
                  ))
                })}
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
                    node={node as { id: number; name: string; icon: string; color: string; model: string; inputPorts: IOPort[]; outputPorts: IOPort[] }}
                    onAdd={() => addStep.mutate({ workflowId, nodeId: node.id })}
                  />
                ))}
              </div>
            )}

            {/* Instructions */}
            <div className="mt-4 pt-4 border-t border-white/5">
              <p className="text-[10px] text-on-surface-variant leading-relaxed">
                <strong className="text-on-surface">Drag-and-drop:</strong> Arraste de uma porta de saída{' '}
                <span className="inline-block w-2 h-2 rounded-full bg-primary align-middle" /> para uma porta de entrada{' '}
                <span className="inline-block w-2 h-2 rounded-full border-2 border-primary align-middle" /> para criar conexões tipadas.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
