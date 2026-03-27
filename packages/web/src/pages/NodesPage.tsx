import { useState } from 'react'
import { trpc } from '../trpc'
import { Icon } from '../components/ui/Icon'

const MODELS = ['gpt-4o', 'gpt-4o-mini', 'claude-sonnet-4-20250514', 'o1-mini', 'o1-preview'] as const
const PORT_TYPES = ['text', 'json', 'code', 'files', 'number', 'boolean'] as const
const NODE_COLORS = ['#9ba8ff', '#9891fe', '#ffa4e4', '#ff6e84', '#4963ff', '#ea82ce'] as const
const NODE_ICONS = ['smart_toy', 'psychology', 'code', 'analytics', 'rate_review', 'auto_fix_high', 'document_scanner', 'translate', 'summarize', 'fact_check'] as const

type PortType = (typeof PORT_TYPES)[number]

interface IOPort {
  key: string
  label: string
  type: PortType
  required: boolean
}

interface NodeFormData {
  name: string
  description: string
  model: string
  systemPrompt: string
  inputPorts: IOPort[]
  outputPorts: IOPort[]
  color: string
  icon: string
}

const defaultInputPort: IOPort = { key: 'input', label: 'Input', type: 'text', required: true }
const defaultOutputPort: IOPort = { key: 'output', label: 'Output', type: 'text', required: true }

const emptyForm: NodeFormData = {
  name: '',
  description: '',
  model: 'gpt-4o',
  systemPrompt: '',
  inputPorts: [{ ...defaultInputPort }],
  outputPorts: [{ ...defaultOutputPort }],
  color: '#9ba8ff',
  icon: 'smart_toy',
}

const PORT_TYPE_COLORS: Record<PortType, string> = {
  text: 'bg-primary/15 text-primary border-primary/30',
  json: 'bg-secondary/15 text-secondary border-secondary/30',
  code: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30',
  files: 'bg-orange-500/15 text-orange-400 border-orange-500/30',
  number: 'bg-tertiary/15 text-tertiary border-tertiary/30',
  boolean: 'bg-gray-500/15 text-gray-400 border-gray-500/30',
}

function toSnakeCase(str: string): string {
  return str.toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_|_$/g, '')
}

function PortBuilder({
  title,
  icon,
  ports,
  onChange,
  color,
}: {
  title: string
  icon: string
  ports: IOPort[]
  onChange: (ports: IOPort[]) => void
  color: string
}) {
  const addPort = () => {
    const idx = ports.length + 1
    onChange([...ports, { key: `port_${idx}`, label: `Port ${idx}`, type: 'text', required: true }])
  }

  const updatePort = (index: number, updates: Partial<IOPort>) => {
    const next = ports.map((p, i) => {
      if (i !== index) return p
      const updated = { ...p, ...updates }
      if (updates.label && !updates.key) {
        updated.key = toSnakeCase(updates.label)
      }
      return updated
    })
    onChange(next)
  }

  const removePort = (index: number) => {
    if (ports.length <= 1) return
    onChange(ports.filter((_, i) => i !== index))
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <label className="flex items-center gap-1.5 text-xs font-semibold text-on-surface-variant font-label">
          <Icon name={icon} size={14} style={{ color }} />
          {title}
        </label>
        <button
          type="button"
          onClick={addPort}
          className="flex items-center gap-1 text-[10px] font-bold text-primary hover:text-primary/80 transition-colors"
        >
          <Icon name="add" size={14} /> Porta
        </button>
      </div>

      <div className="space-y-2">
        {ports.map((port, i) => (
          <div key={i} className="flex items-center gap-2 bg-surface-container-lowest rounded-lg p-2">
            <div className={`w-2.5 h-2.5 rounded-full flex-shrink-0 border ${PORT_TYPE_COLORS[port.type]}`} />

            <input
              type="text"
              value={port.label}
              onChange={(e) => updatePort(i, { label: e.target.value })}
              placeholder="Nome"
              className="flex-1 min-w-0 bg-transparent text-on-surface text-xs px-2 py-1 rounded border border-white/5 focus:border-primary/30 focus:outline-none"
            />

            <span className="text-[9px] text-on-surface-variant font-mono flex-shrink-0 w-16 truncate">
              {port.key}
            </span>

            <select
              value={port.type}
              onChange={(e) => updatePort(i, { type: e.target.value as PortType })}
              className="bg-surface-container-low text-on-surface text-[10px] px-1.5 py-1 rounded border-none appearance-none w-20 flex-shrink-0"
            >
              {PORT_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
            </select>

            <button
              type="button"
              onClick={() => updatePort(i, { required: !port.required })}
              className={`text-[9px] font-bold px-1.5 py-0.5 rounded transition-colors flex-shrink-0 ${
                port.required ? 'bg-primary/15 text-primary' : 'bg-surface-container-high text-on-surface-variant'
              }`}
            >
              {port.required ? 'REQ' : 'OPT'}
            </button>

            <button
              type="button"
              onClick={() => removePort(i)}
              disabled={ports.length <= 1}
              className="text-on-surface-variant hover:text-error transition-colors disabled:opacity-30 flex-shrink-0"
            >
              <Icon name="close" size={14} />
            </button>
          </div>
        ))}
      </div>
    </div>
  )
}

export function NodesPage() {
  const [showForm, setShowForm] = useState(false)
  const [editingId, setEditingId] = useState<number | null>(null)
  const [form, setForm] = useState<NodeFormData>(emptyForm)

  const utils = trpc.useUtils()
  const { data: nodes, isLoading } = trpc.nodes.list.useQuery()

  const createNode = trpc.nodes.create.useMutation({
    onSuccess: () => { utils.nodes.list.invalidate(); resetForm() },
  })
  const updateNode = trpc.nodes.update.useMutation({
    onSuccess: () => { utils.nodes.list.invalidate(); resetForm() },
  })
  const deleteNode = trpc.nodes.delete.useMutation({
    onSuccess: () => utils.nodes.list.invalidate(),
  })

  const resetForm = () => {
    setForm(emptyForm)
    setShowForm(false)
    setEditingId(null)
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.name.trim() || !form.systemPrompt.trim()) return

    const payload = {
      ...form,
      inputType: form.inputPorts[0]?.type ?? 'text',
      outputType: form.outputPorts[0]?.type ?? 'text',
    }

    if (editingId) {
      updateNode.mutate({ id: editingId, ...payload })
    } else {
      createNode.mutate(payload)
    }
  }

  const startEdit = (node: NonNullable<typeof nodes>[number]) => {
    setForm({
      name: node.name,
      description: node.description,
      model: node.model,
      systemPrompt: node.systemPrompt,
      inputPorts: (node.inputPorts as IOPort[])?.length > 0
        ? (node.inputPorts as IOPort[])
        : [{ ...defaultInputPort }],
      outputPorts: (node.outputPorts as IOPort[])?.length > 0
        ? (node.outputPorts as IOPort[])
        : [{ ...defaultOutputPort }],
      color: node.color,
      icon: node.icon,
    })
    setEditingId(node.id)
    setShowForm(true)
  }

  return (
    <div className="max-w-6xl mx-auto py-8">
      <header className="flex items-center justify-between mb-10">
        <div>
          <h1 className="text-4xl font-bold font-space-grotesk tracking-tight text-white mb-2">
            AI <span className="text-secondary">Nodes</span>
          </h1>
          <p className="text-on-surface-variant font-body">
            Crie módulos de AI reutilizáveis com portas de entrada/saída tipadas.
          </p>
        </div>
        <button
          onClick={() => { resetForm(); setShowForm(!showForm) }}
          className="flex items-center gap-2 px-5 py-2.5 bg-primary text-on-primary rounded-xl text-sm font-medium hover:brightness-110 active:scale-95 transition-all"
        >
          <Icon name={showForm ? 'close' : 'add'} size={18} />
          {showForm ? 'Cancelar' : 'Novo Node'}
        </button>
      </header>

      {/* Create/Edit Form */}
      {showForm && (
        <form
          onSubmit={handleSubmit}
          className="glass-effect rounded-xl p-6 border border-white/5 mb-8 space-y-5"
        >
          <div className="flex items-center gap-3 mb-2">
            <div
              className="w-10 h-10 rounded-lg flex items-center justify-center"
              style={{ backgroundColor: form.color + '22', borderColor: form.color, borderWidth: 2 }}
            >
              <Icon name={form.icon} className="text-white" />
            </div>
            <h2 className="text-lg font-bold font-space-grotesk text-on-surface">
              {editingId ? 'Editar Node' : 'Criar Node'}
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Name */}
            <div>
              <label className="block text-xs font-semibold text-on-surface-variant font-label mb-1.5">Nome</label>
              <input
                type="text"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                placeholder="Ex: Code Reviewer"
                className="w-full bg-surface-container-low text-on-surface px-3 py-2.5 rounded-xl border-none focus:ring-1 focus:ring-primary/40 text-sm"
              />
            </div>

            {/* Model */}
            <div>
              <label className="block text-xs font-semibold text-on-surface-variant font-label mb-1.5">Modelo</label>
              <select
                value={form.model}
                onChange={(e) => setForm({ ...form, model: e.target.value })}
                className="w-full bg-surface-container-low text-on-surface px-3 py-2.5 rounded-xl border-none focus:ring-1 focus:ring-primary/40 text-sm appearance-none"
              >
                {MODELS.map((m) => <option key={m} value={m}>{m}</option>)}
              </select>
            </div>
          </div>

          {/* IO Ports */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <PortBuilder
              title="Portas de Entrada"
              icon="login"
              ports={form.inputPorts}
              onChange={(inputPorts) => setForm({ ...form, inputPorts })}
              color="#9ba8ff"
            />
            <PortBuilder
              title="Portas de Saída"
              icon="logout"
              ports={form.outputPorts}
              onChange={(outputPorts) => setForm({ ...form, outputPorts })}
              color="#ffa4e4"
            />
          </div>

          {/* Description */}
          <div>
            <label className="block text-xs font-semibold text-on-surface-variant font-label mb-1.5">Descrição</label>
            <input
              type="text"
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              placeholder="Breve descrição do que o node faz"
              className="w-full bg-surface-container-low text-on-surface px-3 py-2.5 rounded-xl border-none focus:ring-1 focus:ring-primary/40 text-sm"
            />
          </div>

          {/* System Prompt */}
          <div>
            <label className="block text-xs font-semibold text-on-surface-variant font-label mb-1.5">System Prompt</label>
            <textarea
              value={form.systemPrompt}
              onChange={(e) => setForm({ ...form, systemPrompt: e.target.value })}
              placeholder="Instruções do sistema para o modelo AI..."
              rows={4}
              className="w-full bg-surface-container-low text-on-surface px-3 py-2.5 rounded-xl border-none focus:ring-1 focus:ring-primary/40 text-sm resize-none"
            />
          </div>

          {/* Color + Icon */}
          <div className="flex flex-wrap gap-6">
            <div>
              <label className="block text-xs font-semibold text-on-surface-variant font-label mb-2">Cor</label>
              <div className="flex gap-2">
                {NODE_COLORS.map((c) => (
                  <button
                    key={c}
                    type="button"
                    onClick={() => setForm({ ...form, color: c })}
                    className={`w-7 h-7 rounded-lg transition-all ${form.color === c ? 'ring-2 ring-white ring-offset-2 ring-offset-surface scale-110' : 'hover:scale-105'}`}
                    style={{ backgroundColor: c }}
                  />
                ))}
              </div>
            </div>
            <div>
              <label className="block text-xs font-semibold text-on-surface-variant font-label mb-2">Ícone</label>
              <div className="flex gap-1.5 flex-wrap">
                {NODE_ICONS.map((ic) => (
                  <button
                    key={ic}
                    type="button"
                    onClick={() => setForm({ ...form, icon: ic })}
                    className={`w-8 h-8 rounded-lg flex items-center justify-center transition-all text-sm ${
                      form.icon === ic
                        ? 'bg-primary/20 text-primary ring-1 ring-primary/40'
                        : 'bg-surface-container-high text-on-surface-variant hover:bg-surface-container-highest'
                    }`}
                  >
                    <Icon name={ic} size={18} />
                  </button>
                ))}
              </div>
            </div>
          </div>

          <button
            type="submit"
            disabled={createNode.isPending || updateNode.isPending}
            className="flex items-center gap-2 px-5 py-2.5 bg-primary text-on-primary rounded-xl text-sm font-medium hover:brightness-110 active:scale-95 transition-all disabled:opacity-50"
          >
            <Icon name={editingId ? 'save' : 'add'} size={18} />
            {editingId ? 'Salvar' : 'Criar Node'}
          </button>
        </form>
      )}

      {/* Nodes Grid */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="glass-effect rounded-xl p-5 border border-white/5 animate-pulse">
              <div className="h-10 w-10 bg-surface-container-high rounded-lg mb-3" />
              <div className="h-4 bg-surface-container-high rounded w-2/3 mb-2" />
              <div className="h-3 bg-surface-container rounded w-1/2" />
            </div>
          ))}
        </div>
      ) : !nodes || nodes.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-24 text-center">
          <div className="w-16 h-16 rounded-full bg-surface-container-high flex items-center justify-center mb-6">
            <Icon name="smart_toy" size={32} className="text-on-surface-variant" />
          </div>
          <h2 className="text-lg font-semibold text-on-surface mb-2 font-space-grotesk">
            Nenhum node ainda
          </h2>
          <p className="text-on-surface-variant text-sm mb-6 max-w-xs">
            Crie o primeiro node AI para usar nos seus workflows.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {nodes.map((node) => {
            const inPorts = (node.inputPorts as IOPort[]) ?? []
            const outPorts = (node.outputPorts as IOPort[]) ?? []
            return (
              <div
                key={node.id}
                className="glass-effect rounded-xl p-5 border-l-4 border border-white/5 relative group hover:border-white/10 transition-colors"
                style={{ borderLeftColor: node.color }}
              >
                <div className="flex items-start justify-between mb-3">
                  <div
                    className="w-10 h-10 rounded-lg flex items-center justify-center"
                    style={{ backgroundColor: node.color + '22' }}
                  >
                    <Icon name={node.icon} className="text-white" size={20} />
                  </div>
                  <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                      onClick={() => startEdit(node)}
                      className="p-1.5 rounded-lg bg-surface-container-high hover:bg-surface-container-highest text-on-surface-variant hover:text-primary transition-colors"
                    >
                      <Icon name="edit" size={16} />
                    </button>
                    <button
                      onClick={() => deleteNode.mutate({ id: node.id })}
                      className="p-1.5 rounded-lg bg-surface-container-high hover:bg-error/10 text-on-surface-variant hover:text-error transition-colors"
                    >
                      <Icon name="delete" size={16} />
                    </button>
                  </div>
                </div>

                <h3 className="text-base font-bold font-space-grotesk text-on-surface mb-1">{node.name}</h3>
                {node.description && (
                  <p className="text-xs text-on-surface-variant mb-3 line-clamp-2">{node.description}</p>
                )}

                {/* IO Ports visual */}
                <div className="flex gap-6 mt-3 mb-2">
                  {inPorts.length > 0 && (
                    <div className="flex-1 min-w-0">
                      <p className="text-[9px] text-on-surface-variant font-bold uppercase tracking-widest mb-1.5">IN</p>
                      <div className="space-y-1">
                        {inPorts.map((p) => (
                          <div key={p.key} className="flex items-center gap-1.5">
                            <div className={`w-2 h-2 rounded-full border ${PORT_TYPE_COLORS[p.type]}`} />
                            <span className="text-[10px] text-on-surface truncate">{p.label}</span>
                            <span className="text-[8px] text-on-surface-variant ml-auto flex-shrink-0">{p.type}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                  {outPorts.length > 0 && (
                    <div className="flex-1 min-w-0">
                      <p className="text-[9px] text-on-surface-variant font-bold uppercase tracking-widest mb-1.5">OUT</p>
                      <div className="space-y-1">
                        {outPorts.map((p) => (
                          <div key={p.key} className="flex items-center gap-1.5">
                            <div className={`w-2 h-2 rounded-full border ${PORT_TYPE_COLORS[p.type]}`} />
                            <span className="text-[10px] text-on-surface truncate">{p.label}</span>
                            <span className="text-[8px] text-on-surface-variant ml-auto flex-shrink-0">{p.type}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                <div className="flex flex-wrap gap-2 mt-auto">
                  <span className="text-[10px] px-2 py-0.5 rounded bg-surface-container-high text-on-surface-variant font-bold uppercase">
                    {node.model}
                  </span>
                </div>

                <p className="text-[10px] text-on-surface-variant mt-3 line-clamp-2 font-mono opacity-60">
                  {node.systemPrompt}
                </p>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
