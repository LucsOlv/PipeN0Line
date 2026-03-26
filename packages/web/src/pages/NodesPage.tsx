import { useState } from 'react'
import { trpc } from '../trpc'
import { Icon } from '../components/ui/Icon'

const MODELS = ['gpt-4o', 'gpt-4o-mini', 'claude-sonnet-4-20250514', 'o1-mini', 'o1-preview'] as const
const INPUT_TYPES = ['text', 'json', 'code'] as const
const OUTPUT_TYPES = ['text', 'json', 'code', 'score'] as const
const NODE_COLORS = ['#9ba8ff', '#9891fe', '#ffa4e4', '#ff6e84', '#4963ff', '#ea82ce'] as const
const NODE_ICONS = ['smart_toy', 'psychology', 'code', 'analytics', 'rate_review', 'auto_fix_high', 'document_scanner', 'translate', 'summarize', 'fact_check'] as const

type InputType = 'text' | 'json' | 'code'
type OutputType = 'text' | 'json' | 'code' | 'score'

interface NodeFormData {
  name: string
  description: string
  model: string
  systemPrompt: string
  inputType: InputType
  outputType: OutputType
  color: string
  icon: string
}

const emptyForm: NodeFormData = {
  name: '',
  description: '',
  model: 'gpt-4o',
  systemPrompt: '',
  inputType: 'text',
  outputType: 'text',
  color: '#9ba8ff',
  icon: 'smart_toy',
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

    if (editingId) {
      updateNode.mutate({ id: editingId, ...form })
    } else {
      createNode.mutate(form)
    }
  }

  const startEdit = (node: NonNullable<typeof nodes>[number]) => {
    setForm({
      name: node.name,
      description: node.description,
      model: node.model,
      systemPrompt: node.systemPrompt,
      inputType: node.inputType as InputType,
      outputType: node.outputType as OutputType,
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
            Crie módulos de AI reutilizáveis para compor workflows.
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

            {/* Input Type */}
            <div>
              <label className="block text-xs font-semibold text-on-surface-variant font-label mb-1.5">Tipo de Entrada</label>
              <select
                value={form.inputType}
                onChange={(e) => setForm({ ...form, inputType: e.target.value as InputType })}
                className="w-full bg-surface-container-low text-on-surface px-3 py-2.5 rounded-xl border-none focus:ring-1 focus:ring-primary/40 text-sm appearance-none"
              >
                {INPUT_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>

            {/* Output Type */}
            <div>
              <label className="block text-xs font-semibold text-on-surface-variant font-label mb-1.5">Tipo de Saída</label>
              <select
                value={form.outputType}
                onChange={(e) => setForm({ ...form, outputType: e.target.value as OutputType })}
                className="w-full bg-surface-container-low text-on-surface px-3 py-2.5 rounded-xl border-none focus:ring-1 focus:ring-primary/40 text-sm appearance-none"
              >
                {OUTPUT_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>
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
          {nodes.map((node) => (
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

              <div className="flex flex-wrap gap-2 mt-auto">
                <span className="text-[10px] px-2 py-0.5 rounded bg-surface-container-high text-on-surface-variant font-bold uppercase">
                  {node.model}
                </span>
                <span className="text-[10px] px-2 py-0.5 rounded bg-primary/10 text-primary font-bold">
                  in: {node.inputType}
                </span>
                <span className="text-[10px] px-2 py-0.5 rounded bg-tertiary/10 text-tertiary font-bold">
                  out: {node.outputType}
                </span>
              </div>

              <p className="text-[10px] text-on-surface-variant mt-3 line-clamp-2 font-mono opacity-60">
                {node.systemPrompt}
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
