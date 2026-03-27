import { useParams, useNavigate } from 'react-router-dom'
import { useState, useRef, useCallback, useEffect } from 'react'
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

// --- Canvas Grid Background ---
function CanvasGrid() {
  return (
    <svg className="absolute inset-0 w-full h-full pointer-events-none opacity-[0.03]">
      <defs>
        <pattern id="grid-dots" width="24" height="24" patternUnits="userSpaceOnUse">
          <circle cx="12" cy="12" r="1" fill="white" />
        </pattern>
      </defs>
      <rect width="100%" height="100%" fill="url(#grid-dots)" />
    </svg>
  )
}

// --- Animated Port Dot ---
function PortDot({
  portId,
  type,
  side,
  connected,
  isValidTarget,
  isDragging,
}: {
  portId: string
  type: PortType
  side: 'in' | 'out'
  connected: boolean
  isValidTarget?: boolean
  isDragging?: boolean
}) {
  const color = PORT_COLOR[type]
  const size = side === 'out' ? 14 : 12
  const isTarget = isValidTarget && isDragging

  return (
    <div
      className="relative flex-shrink-0"
      data-port-id={portId}
      style={{ width: size, height: size }}
    >
      {/* Pulse ring for valid drop targets */}
      {isTarget && (
        <div
          className="absolute inset-[-4px] rounded-full animate-ping"
          style={{ backgroundColor: color + '30' }}
        />
      )}
      {/* Glow ring on hover */}
      <div
        className={`absolute inset-[-3px] rounded-full transition-opacity duration-200 ${
          isTarget ? 'opacity-100' : 'opacity-0 group-hover/port:opacity-100'
        }`}
        style={{ backgroundColor: color + '15' }}
      />
      {/* Main dot */}
      <div
        className={`w-full h-full rounded-full border-2 transition-all duration-200 ${
          isTarget ? 'scale-150' : 'group-hover/port:scale-125'
        }`}
        style={{
          borderColor: color,
          backgroundColor: connected ? color + '90' : isTarget ? color + '60' : color + '20',
          boxShadow: connected || isTarget ? `0 0 8px ${color}50` : 'none',
        }}
      />
    </div>
  )
}

// --- Task Node (start) ---
function TaskNode({
  onPortDragStart,
  isDragging,
}: {
  onPortDragStart: (portKey: string, portType: PortType, e: React.MouseEvent) => void
  isDragging: boolean
}) {
  return (
    <div className="relative glass-effect rounded-xl p-4 border-2 border-emerald-500/30 min-w-[190px] shrink-0 animate-[fadeSlideIn_0.4s_ease-out] group/task hover:border-emerald-500/50 transition-all duration-300">
      {/* Glow */}
      <div className="absolute inset-0 rounded-xl bg-emerald-500/5 opacity-0 group-hover/task:opacity-100 transition-opacity duration-300 -z-10 blur-xl" />

      <div className="absolute -top-2.5 -left-2.5 w-6 h-6 rounded-lg flex items-center justify-center text-[10px] font-bold text-white bg-emerald-500 shadow-lg shadow-emerald-500/20">
        T
      </div>
      <div className="flex items-center gap-2 mb-4">
        <div className="w-9 h-9 rounded-lg flex items-center justify-center bg-emerald-500/15 border border-emerald-500/20">
          <Icon name="assignment" size={18} className="text-emerald-400" />
        </div>
        <div>
          <h4 className="text-sm font-bold font-space-grotesk text-on-surface">Task</h4>
          <p className="text-[10px] text-on-surface-variant">Dados do Run</p>
        </div>
      </div>

      {/* Output ports */}
      <div className="space-y-2">
        {TASK_OUTPUTS.map((port) => (
          <div
            key={port.key}
            className="flex items-center gap-2 group/port cursor-grab active:cursor-grabbing rounded-lg px-1.5 py-1 -mx-1.5 hover:bg-white/[0.03] transition-colors"
            onMouseDown={(e) => onPortDragStart(port.key, port.type, e)}
          >
            <span className="text-[10px] text-on-surface/80 flex-1 truncate">{port.label}</span>
            <span className="text-[8px] text-on-surface-variant/60 font-mono">{port.type}</span>
            <PortDot
              portId={`task-out-${port.key}`}
              type={port.type}
              side="out"
              connected={false}
              isDragging={isDragging}
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
  index,
  onRemove,
  onMoveLeft,
  onMoveRight,
  isFirst,
  isLast,
  onOutputDragStart,
  onInputDrop,
  onRemoveBinding,
  dragState,
}: {
  step: WorkflowStep
  index: number
  onRemove: () => void
  onMoveLeft: () => void
  onMoveRight: () => void
  isFirst: boolean
  isLast: boolean
  onOutputDragStart: (portKey: string, portType: PortType, e: React.MouseEvent) => void
  onInputDrop: (portKey: string) => void
  onRemoveBinding: (portKey: string) => void
  dragState: DragState | null
}) {
  const { node } = step
  const bindings = step.config?.bindings ?? {}
  const isDragging = !!dragState

  return (
    <div
      className="relative glass-effect rounded-xl p-4 border-2 min-w-[210px] max-w-[250px] shrink-0 group hover:shadow-lg transition-all duration-300"
      style={{
        borderColor: node.color + '40',
        animationDelay: `${index * 80}ms`,
      }}
    >
      {/* Glow on hover */}
      <div
        className="absolute inset-0 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-300 -z-10 blur-2xl"
        style={{ backgroundColor: node.color + '12' }}
      />

      {/* Position badge */}
      <div
        className="absolute -top-2.5 -left-2.5 w-6 h-6 rounded-lg flex items-center justify-center text-[10px] font-bold text-white shadow-lg"
        style={{ backgroundColor: node.color, boxShadow: `0 4px 12px ${node.color}30` }}
      >
        {step.position + 1}
      </div>

      {/* Header */}
      <div className="flex items-center gap-2 mb-4">
        <div
          className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0 border"
          style={{ backgroundColor: node.color + '15', borderColor: node.color + '20' }}
        >
          <Icon name={node.icon} size={18} className="text-white" />
        </div>
        <div className="min-w-0">
          <h4 className="text-sm font-bold font-space-grotesk text-on-surface truncate">{node.name}</h4>
          <p className="text-[10px] text-on-surface-variant truncate">{node.model}</p>
        </div>
      </div>

      {/* Input ports (left side) */}
      <div className="mb-3">
        <p className="text-[9px] text-on-surface-variant/60 font-bold uppercase tracking-widest mb-1.5 flex items-center gap-1">
          <span className="w-1 h-1 rounded-full bg-primary/40" />
          INPUT
        </p>
        <div className="space-y-1">
          {node.inputPorts.map((port) => {
            const binding = bindings[port.key]
            const isDropTarget = dragState && areCompatible(dragState.sourcePortType, port.type)
            return (
              <div
                key={port.key}
                className={`flex items-center gap-2 rounded-lg px-1.5 py-1 -mx-1.5 transition-all duration-200 ${
                  isDropTarget
                    ? 'bg-primary/10 ring-1 ring-primary/20 scale-[1.02]'
                    : binding
                      ? 'bg-white/[0.02]'
                      : ''
                }`}
                onMouseUp={() => {
                  if (dragState && areCompatible(dragState.sourcePortType, port.type)) {
                    onInputDrop(port.key)
                  }
                }}
              >
                <PortDot
                  portId={`step-${step.position}-in-${port.key}`}
                  type={port.type}
                  side="in"
                  connected={!!binding}
                  isValidTarget={!!isDropTarget}
                  isDragging={isDragging}
                />
                <span className="text-[10px] text-on-surface/80 flex-1 truncate">{port.label}</span>
                {binding ? (
                  <button
                    onClick={(e) => { e.stopPropagation(); onRemoveBinding(port.key) }}
                    className="flex items-center gap-0.5 text-[8px] font-mono px-1.5 py-0.5 rounded bg-primary/10 text-primary/80 hover:bg-error/15 hover:text-error transition-colors group/bind"
                    title="Clique para remover conexão"
                  >
                    <span className="group-hover/bind:hidden truncate max-w-[70px]">
                      {binding.source === 'task' ? `task.${binding.field}` : `s${binding.stepPosition}.${binding.field}`}
                    </span>
                    <Icon name="close" size={10} className="hidden group-hover/bind:block" />
                  </button>
                ) : (
                  <span className="text-[8px] text-on-surface-variant/40 italic">—</span>
                )}
              </div>
            )
          })}
        </div>
      </div>

      {/* Output ports (right side) */}
      <div>
        <p className="text-[9px] text-on-surface-variant/60 font-bold uppercase tracking-widest mb-1.5 flex items-center gap-1">
          <span className="w-1 h-1 rounded-full bg-tertiary/40" />
          OUTPUT
        </p>
        <div className="space-y-1">
          {node.outputPorts.map((port) => (
            <div
              key={port.key}
              className="flex items-center gap-2 group/port cursor-grab active:cursor-grabbing rounded-lg px-1.5 py-1 -mx-1.5 hover:bg-white/[0.03] transition-colors"
              onMouseDown={(e) => onOutputDragStart(port.key, port.type, e)}
            >
              <span className="text-[10px] text-on-surface/80 flex-1 truncate">{port.label}</span>
              <span className="text-[8px] text-on-surface-variant/60 font-mono">{port.type}</span>
              <PortDot
                portId={`step-${step.position}-out-${port.key}`}
                type={port.type}
                side="out"
                connected={false}
                isDragging={isDragging}
              />
            </div>
          ))}
        </div>
      </div>

      {/* Actions */}
      <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity duration-200 mt-3 pt-3 border-t border-white/5 justify-between">
        <div className="flex gap-1">
          <button
            onClick={onMoveLeft}
            disabled={isFirst}
            className="p-1 rounded-lg bg-surface-container-high hover:bg-surface-container-highest text-on-surface-variant disabled:opacity-20 transition-colors"
          >
            <Icon name="chevron_left" size={14} />
          </button>
          <button
            onClick={onMoveRight}
            disabled={isLast}
            className="p-1 rounded-lg bg-surface-container-high hover:bg-surface-container-highest text-on-surface-variant disabled:opacity-20 transition-colors"
          >
            <Icon name="chevron_right" size={14} />
          </button>
        </div>
        <button
          onClick={onRemove}
          className="p-1 rounded-lg bg-surface-container-high hover:bg-error/15 text-on-surface-variant hover:text-error transition-colors"
        >
          <Icon name="delete" size={14} />
        </button>
      </div>
    </div>
  )
}

// --- Animated Connector Arrow ---
function Connector({ index = 0 }: { index?: number }) {
  return (
    <div className="shrink-0 mx-1 flex items-center" style={{ animationDelay: `${index * 80 + 40}ms` }}>
      <svg width="56" height="28" viewBox="0 0 56 28" className="overflow-visible">
        <defs>
          <linearGradient id={`connGrad-${index}`} x1="0" x2="1" y1="0" y2="0">
            <stop offset="0%" stopColor="#9ba8ff" stopOpacity="0.4" />
            <stop offset="50%" stopColor="#9891fe" stopOpacity="0.5" />
            <stop offset="100%" stopColor="#ffa4e4" stopOpacity="0.4" />
          </linearGradient>
        </defs>
        {/* Track line */}
        <line x1="4" y1="14" x2="40" y2="14" stroke="white" strokeWidth="1" strokeOpacity="0.04" />
        {/* Animated flow line */}
        <line
          x1="4" y1="14" x2="40" y2="14"
          stroke={`url(#connGrad-${index})`}
          strokeWidth="2"
          strokeDasharray="6 4"
          strokeLinecap="round"
        >
          <animate attributeName="stroke-dashoffset" values="0;-20" dur="1.5s" repeatCount="indefinite" />
        </line>
        {/* Arrow */}
        <polygon points="40,8 52,14 40,20" fill="#ffa4e4" opacity="0.5">
          <animate attributeName="opacity" values="0.3;0.6;0.3" dur="1.5s" repeatCount="indefinite" />
        </polygon>
      </svg>
    </div>
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
      className="flex items-center gap-2.5 w-full p-2.5 rounded-xl hover:bg-surface-container-highest transition-all duration-200 text-left group/item active:scale-[0.97]"
    >
      <div
        className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0 border transition-all duration-200 group-hover/item:shadow-lg"
        style={{
          backgroundColor: node.color + '15',
          borderColor: node.color + '20',
          boxShadow: `0 0 0 0 ${node.color}00`,
        }}
      >
        <Icon name={node.icon} size={16} className="text-white" />
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-xs font-bold text-on-surface truncate group-hover/item:text-primary transition-colors">{node.name}</p>
        <div className="flex gap-1 mt-0.5 items-center">
          {node.inputPorts.slice(0, 2).map((p) => (
            <span key={p.key} className="text-[7px] px-1 py-px rounded font-mono" style={{ backgroundColor: PORT_COLOR[p.type] + '15', color: PORT_COLOR[p.type] }}>
              {p.type}
            </span>
          ))}
          <Icon name="east" size={8} className="text-on-surface-variant/30" />
          {node.outputPorts.slice(0, 2).map((p) => (
            <span key={p.key} className="text-[7px] px-1 py-px rounded font-mono" style={{ backgroundColor: PORT_COLOR[p.type] + '15', color: PORT_COLOR[p.type] }}>
              {p.type}
            </span>
          ))}
        </div>
      </div>
      <div className="flex items-center justify-center w-6 h-6 rounded-lg bg-primary/0 group-hover/item:bg-primary/10 transition-colors">
        <Icon name="add" size={16} className="text-on-surface-variant/40 group-hover/item:text-primary transition-colors" />
      </div>
    </button>
  )
}

// --- Connection Lines SVG overlay ---
function ConnectionLines({ steps, renderKey }: { steps: WorkflowStep[]; renderKey: number }) {
  const [lines, setLines] = useState<{ fromPort: string; toPort: string; color: string; key: string }[]>([])

  useEffect(() => {
    // Small delay to let DOM settle after mutations
    const timer = setTimeout(() => {
      const newLines: typeof lines = []
      for (const step of steps) {
        const bindings = step.config?.bindings ?? {}
        for (const [inputKey, binding] of Object.entries(bindings)) {
          const inputPort = step.node.inputPorts.find((p) => p.key === inputKey)
          if (!inputPort) continue

          const fromId = binding.source === 'task'
            ? `task-out-${binding.field}`
            : `step-${binding.stepPosition}-out-${binding.field}`
          const toId = `step-${step.position}-in-${inputKey}`

          newLines.push({
            fromPort: fromId,
            toPort: toId,
            color: PORT_COLOR[inputPort.type],
            key: `${step.id}-${inputKey}`,
          })
        }
      }
      setLines(newLines)
    }, 50)
    return () => clearTimeout(timer)
  }, [steps, renderKey])

  if (lines.length === 0) return null

  return (
    <svg className="absolute inset-0 w-full h-full pointer-events-none z-10" style={{ overflow: 'visible' }}>
      <defs>
        {lines.map((line) => (
          <linearGradient key={`grad-${line.key}`} id={`conn-grad-${line.key}`} x1="0" x2="1" y1="0" y2="0">
            <stop offset="0%" stopColor={line.color} stopOpacity="0.6" />
            <stop offset="100%" stopColor={line.color} stopOpacity="0.3" />
          </linearGradient>
        ))}
      </defs>
      {lines.map((line) => {
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

        const dx = Math.abs(x2 - x1)
        const cpx = Math.max(dx * 0.4, 40)

        return (
          <g key={line.key}>
            {/* Shadow/glow line */}
            <path
              d={`M ${x1} ${y1} C ${x1 + cpx} ${y1}, ${x2 - cpx} ${y2}, ${x2} ${y2}`}
              fill="none"
              stroke={line.color}
              strokeWidth="6"
              strokeOpacity="0.08"
              filter="blur(4px)"
            />
            {/* Main line */}
            <path
              d={`M ${x1} ${y1} C ${x1 + cpx} ${y1}, ${x2 - cpx} ${y2}, ${x2} ${y2}`}
              fill="none"
              stroke={`url(#conn-grad-${line.key})`}
              strokeWidth="2"
              strokeLinecap="round"
            />
            {/* Animated flow dots */}
            <circle r="2.5" fill={line.color} opacity="0.7">
              <animateMotion
                dur="2s"
                repeatCount="indefinite"
                path={`M ${x1} ${y1} C ${x1 + cpx} ${y1}, ${x2 - cpx} ${y2}, ${x2} ${y2}`}
              />
            </circle>
          </g>
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
  const [renderKey, setRenderKey] = useState(0)
  const [toolboxSearch, setToolboxSearch] = useState('')
  const canvasRef = useRef<HTMLDivElement>(null)

  const utils = trpc.useUtils()
  const { data: workflow, isLoading } = trpc.workflows.get.useQuery(
    { id: workflowId },
    { enabled: !isNaN(workflowId) }
  )
  const { data: allNodes } = trpc.nodes.list.useQuery()

  const invalidate = () => {
    utils.workflows.get.invalidate({ id: workflowId })
    setTimeout(() => setRenderKey((k) => k + 1), 100)
  }

  const updateWorkflow = trpc.workflows.update.useMutation({
    onSuccess: () => { invalidate(); setIsEditingName(false) },
  })

  const addStep = trpc.workflows.addStep.useMutation({ onSuccess: invalidate })
  const removeStep = trpc.workflows.removeStep.useMutation({ onSuccess: invalidate })
  const reorderSteps = trpc.workflows.reorderSteps.useMutation({ onSuccess: invalidate })
  const updateStepConfig = trpc.workflows.updateStepConfig.useMutation({ onSuccess: invalidate })

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

  const handlePortDragStart = useCallback((
    sourceType: 'task' | 'step',
    sourceStepPosition: number | undefined,
    portKey: string,
    portType: PortType,
    e: React.MouseEvent,
  ) => {
    e.preventDefault()
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

  const handleRemoveBinding = useCallback((step: WorkflowStep, inputPortKey: string) => {
    const currentBindings = { ...(step.config?.bindings ?? {}) }
    delete currentBindings[inputPortKey]
    updateStepConfig.mutate({
      stepId: step.id,
      config: { bindings: currentBindings },
    })
  }, [updateStepConfig])

  // Re-render connection lines when layout changes
  useEffect(() => {
    const timer = setTimeout(() => setRenderKey((k) => k + 1), 300)
    return () => clearTimeout(timer)
  }, [workflow?.steps?.length])

  if (isLoading) {
    return (
      <div className="max-w-6xl mx-auto py-8">
        <div className="animate-pulse space-y-6">
          <div className="h-8 bg-surface-container-high rounded-xl w-1/3" />
          <div className="h-60 bg-surface-container rounded-xl" />
        </div>
      </div>
    )
  }

  if (!workflow) {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-center">
        <div className="w-16 h-16 rounded-full bg-surface-container-high flex items-center justify-center mb-4">
          <Icon name="error_outline" size={32} className="text-on-surface-variant" />
        </div>
        <p className="text-on-surface-variant mb-4">Workflow não encontrado.</p>
        <button onClick={() => navigate('/workflows')} className="text-primary text-sm hover:underline flex items-center gap-1">
          <Icon name="arrow_back" size={14} /> Voltar para Workflows
        </button>
      </div>
    )
  }

  const steps = (workflow.steps ?? []) as WorkflowStep[]
  const totalBindings = steps.reduce((acc, s) => acc + Object.keys(s.config?.bindings ?? {}).length, 0)

  const filteredNodes = (allNodes ?? []).filter((n) =>
    !toolboxSearch || n.name.toLowerCase().includes(toolboxSearch.toLowerCase())
  )

  return (
    <div
      className="max-w-[100rem] mx-auto py-8"
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
    >
      {/* Top bar */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <button
            onClick={() => navigate('/workflows')}
            className="flex items-center gap-2 text-on-surface-variant hover:text-primary transition-colors group p-1.5 rounded-lg hover:bg-surface-container-high"
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
              className="text-2xl font-bold font-space-grotesk text-on-surface cursor-pointer hover:text-primary transition-colors flex items-center gap-2 group/name"
            >
              {workflow.name}
              <Icon name="edit" size={14} className="text-on-surface-variant opacity-0 group-hover/name:opacity-40 transition-opacity" />
            </h1>
          )}
        </div>

        <div className="flex items-center gap-4">
          {/* Stats */}
          <div className="flex items-center gap-3 text-xs">
            <div className="flex items-center gap-1.5 text-on-surface-variant bg-surface-container-high px-2.5 py-1.5 rounded-lg">
              <Icon name="lan" size={14} />
              <span className="font-bold">{steps.length}</span>
              <span className="text-on-surface-variant/60">nodes</span>
            </div>
            <div className="flex items-center gap-1.5 text-on-surface-variant bg-surface-container-high px-2.5 py-1.5 rounded-lg">
              <Icon name="cable" size={14} />
              <span className="font-bold">{totalBindings}</span>
              <span className="text-on-surface-variant/60">links</span>
            </div>
          </div>

          {/* Port type legend */}
          <div className="hidden lg:flex items-center gap-2.5 bg-surface-container-high px-3 py-1.5 rounded-lg">
            {PORT_TYPES.map((t) => (
              <div key={t} className="flex items-center gap-1">
                <div className="w-2 h-2 rounded-full" style={{ backgroundColor: PORT_COLOR[t] }} />
                <span className="text-[8px] text-on-surface-variant/70 uppercase font-mono">{t}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="flex gap-6">
        {/* Canvas */}
        <div className="flex-1 min-w-0">
          <div
            ref={canvasRef}
            className="canvas-container glass-effect rounded-xl border border-white/5 p-6 min-h-[450px] relative overflow-hidden"
          >
            <CanvasGrid />

            {steps.length === 0 ? (
              <div className="flex items-center gap-0 overflow-x-auto pb-4 custom-scrollbar relative z-10">
                <TaskNode
                  onPortDragStart={(portKey, portType, e) =>
                    handlePortDragStart('task', undefined, portKey, portType, e)
                  }
                  isDragging={!!dragState}
                />
                <Connector />
                <div className="flex flex-col items-center justify-center py-10 px-16 text-center border-2 border-dashed border-white/[0.06] rounded-xl bg-white/[0.01] hover:border-white/[0.1] hover:bg-white/[0.02] transition-all duration-300">
                  <div className="w-12 h-12 rounded-full bg-surface-container-high flex items-center justify-center mb-3">
                    <Icon name="add_circle" size={24} className="text-on-surface-variant/50" />
                  </div>
                  <p className="text-on-surface-variant/70 text-xs font-medium mb-1">Pipeline vazio</p>
                  <p className="text-on-surface-variant/40 text-[10px]">Adicione nodes do painel lateral →</p>
                </div>
              </div>
            ) : (
              <>
                <ConnectionLines steps={steps} renderKey={renderKey} />
                <div className="flex items-start gap-0 overflow-x-auto pb-4 custom-scrollbar relative z-10">
                  <TaskNode
                    onPortDragStart={(portKey, portType, e) =>
                      handlePortDragStart('task', undefined, portKey, portType, e)
                    }
                    isDragging={!!dragState}
                  />
                  <Connector index={0} />
                  {steps.map((step, i) => (
                    <div key={step.id} className="flex items-center">
                      <StepNode
                        step={step}
                        index={i}
                        onRemove={() => removeStep.mutate({ stepId: step.id })}
                        onMoveLeft={() => handleReorder(step.id, -1)}
                        onMoveRight={() => handleReorder(step.id, 1)}
                        isFirst={i === 0}
                        isLast={i === steps.length - 1}
                        onOutputDragStart={(portKey, portType, e) =>
                          handlePortDragStart('step', step.position, portKey, portType, e)
                        }
                        onInputDrop={(portKey) => handleInputDrop(step, portKey)}
                        onRemoveBinding={(portKey) => handleRemoveBinding(step, portKey)}
                        dragState={dragState}
                      />
                      {i < steps.length - 1 && <Connector index={i + 1} />}
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
                <defs>
                  <linearGradient id="drag-grad" x1="0" x2="1" y1="0" y2="0">
                    <stop offset="0%" stopColor={PORT_COLOR[dragState.sourcePortType]} stopOpacity="0.8" />
                    <stop offset="100%" stopColor={PORT_COLOR[dragState.sourcePortType]} stopOpacity="0.3" />
                  </linearGradient>
                </defs>
                {/* Shadow */}
                <line
                  x1={dragState.startX}
                  y1={dragState.startY}
                  x2={dragState.mouseX}
                  y2={dragState.mouseY}
                  stroke={PORT_COLOR[dragState.sourcePortType]}
                  strokeWidth="6"
                  strokeOpacity="0.1"
                  filter="blur(4px)"
                />
                {/* Main line */}
                <line
                  x1={dragState.startX}
                  y1={dragState.startY}
                  x2={dragState.mouseX}
                  y2={dragState.mouseY}
                  stroke="url(#drag-grad)"
                  strokeWidth="2"
                  strokeDasharray="8 4"
                  strokeLinecap="round"
                >
                  <animate attributeName="stroke-dashoffset" values="0;-24" dur="0.6s" repeatCount="indefinite" />
                </line>
                {/* Cursor dot */}
                <circle cx={dragState.mouseX} cy={dragState.mouseY} r="5" fill={PORT_COLOR[dragState.sourcePortType]} opacity="0.6">
                  <animate attributeName="r" values="4;6;4" dur="0.8s" repeatCount="indefinite" />
                </circle>
                {/* Origin dot */}
                <circle cx={dragState.startX} cy={dragState.startY} r="3" fill={PORT_COLOR[dragState.sourcePortType]} opacity="0.8" />
              </svg>
            )}
          </div>

          {/* Bindings summary */}
          {totalBindings > 0 && (
            <div className="mt-4 glass-effect rounded-xl border border-white/5 p-4">
              <h3 className="text-[10px] font-bold text-on-surface-variant/60 uppercase tracking-widest mb-3 flex items-center gap-2">
                <Icon name="cable" size={14} />
                {totalBindings} Conexões Ativas
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-1.5">
                {steps.map((step) => {
                  const bindings = step.config?.bindings ?? {}
                  return Object.entries(bindings).map(([inputKey, binding]) => {
                    const port = step.node.inputPorts.find((p) => p.key === inputKey)
                    return (
                      <div key={`${step.id}-${inputKey}`} className="flex items-center gap-1.5 text-xs group/conn">
                        <div className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: port ? PORT_COLOR[port.type] : '#666' }} />
                        <span className="text-on-surface-variant/60 font-mono text-[10px]">
                          {binding.source === 'task' ? 'task' : `step[${binding.stepPosition}]`}.{binding.field}
                        </span>
                        <Icon name="east" size={10} className="text-on-surface-variant/20" />
                        <span className="font-medium text-[10px]" style={{ color: step.node.color }}>
                          {step.node.name}
                        </span>
                        <span className="text-on-surface-variant/40 text-[10px]">.{inputKey}</span>
                      </div>
                    )
                  })
                })}
              </div>
            </div>
          )}
        </div>

        {/* Toolbox Sidebar */}
        <div className="w-72 shrink-0">
          <div className="glass-effect rounded-xl border border-white/5 p-4 sticky top-24">
            <h3 className="text-[10px] font-bold text-on-surface-variant/60 uppercase tracking-widest mb-3 flex items-center gap-2">
              <Icon name="widgets" size={14} />
              Nodes Disponíveis
              {allNodes && allNodes.length > 0 && (
                <span className="ml-auto bg-surface-container-highest text-on-surface-variant px-1.5 py-0.5 rounded text-[9px]">
                  {allNodes.length}
                </span>
              )}
            </h3>

            {/* Search */}
            {allNodes && allNodes.length > 3 && (
              <div className="relative mb-3">
                <Icon name="search" size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-on-surface-variant/40" />
                <input
                  type="text"
                  value={toolboxSearch}
                  onChange={(e) => setToolboxSearch(e.target.value)}
                  placeholder="Buscar node..."
                  className="w-full bg-surface-container-lowest text-on-surface pl-8 pr-3 py-2 rounded-lg border-none focus:ring-1 focus:ring-primary/30 text-xs placeholder:text-on-surface-variant/30"
                />
              </div>
            )}

            {!allNodes || allNodes.length === 0 ? (
              <div className="text-center py-8">
                <div className="w-10 h-10 rounded-full bg-surface-container-high flex items-center justify-center mx-auto mb-3">
                  <Icon name="smart_toy" size={20} className="text-on-surface-variant/40" />
                </div>
                <p className="text-xs text-on-surface-variant/70 mb-2">Nenhum node criado.</p>
                <button
                  onClick={() => navigate('/nodes')}
                  className="text-xs text-primary hover:underline flex items-center gap-1 mx-auto"
                >
                  Criar nodes <Icon name="arrow_forward" size={12} />
                </button>
              </div>
            ) : filteredNodes.length === 0 ? (
              <div className="text-center py-6">
                <p className="text-xs text-on-surface-variant/50">Nenhum resultado para "{toolboxSearch}"</p>
              </div>
            ) : (
              <div className="space-y-0.5 max-h-[55vh] overflow-y-auto custom-scrollbar">
                {filteredNodes.map((node) => (
                  <NodeToolboxItem
                    key={node.id}
                    node={node as { id: number; name: string; icon: string; color: string; model: string; inputPorts: IOPort[]; outputPorts: IOPort[] }}
                    onAdd={() => addStep.mutate({ workflowId, nodeId: node.id })}
                  />
                ))}
              </div>
            )}

            {/* Instructions */}
            <div className="mt-4 pt-4 border-t border-white/5 space-y-2">
              <p className="text-[10px] text-on-surface-variant/50 leading-relaxed flex items-start gap-1.5">
                <span className="inline-block w-2 h-2 rounded-full bg-primary/40 mt-1 shrink-0" />
                Arraste de uma porta de saída para uma de entrada para conectar.
              </p>
              <p className="text-[10px] text-on-surface-variant/50 leading-relaxed flex items-start gap-1.5">
                <span className="inline-block w-2 h-2 rounded-full bg-error/40 mt-1 shrink-0" />
                Clique em uma conexão existente para removê-la.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
