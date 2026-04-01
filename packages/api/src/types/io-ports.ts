import { z } from 'zod'

export const PORT_TYPES = ['text', 'json', 'code', 'files', 'number', 'boolean'] as const
export type PortType = (typeof PORT_TYPES)[number]

export const ioPortSchema = z.object({
  key: z.string().min(1).regex(/^[a-z][a-z0-9_]*$/, 'Key must be lowercase snake_case'),
  label: z.string().min(1),
  type: z.enum(PORT_TYPES),
  required: z.boolean().default(true),
})

export type IOPort = z.infer<typeof ioPortSchema>

export const bindingSchema = z.object({
  source: z.enum(['task', 'step']),
  field: z.string().min(1),
  stepPosition: z.number().optional(),
})

export type Binding = z.infer<typeof bindingSchema>

export const stepConfigSchema = z.object({
  bindings: z.record(z.string(), bindingSchema).default({}),
})

export type StepConfig = z.infer<typeof stepConfigSchema>

/** Built-in task fields available as data sources */
export const TASK_FIELDS: IOPort[] = [
  { key: 'task_name', label: 'Nome da Task', type: 'text', required: true },
  { key: 'task_description', label: 'Descrição da Task', type: 'text', required: false },
  { key: 'files', label: 'Arquivos do Projeto', type: 'files', required: true },
  { key: 'project_name', label: 'Nome do Projeto', type: 'text', required: true },
  { key: 'branch', label: 'Branch', type: 'text', required: true },
  { key: 'project_path', label: 'Caminho do Projeto', type: 'text', required: true },
]

/** Type compatibility matrix */
const TYPE_COMPAT: Record<PortType, PortType[]> = {
  text: ['text', 'code', 'json'],
  json: ['json', 'text'],
  code: ['code', 'text'],
  files: ['files', 'text'],
  number: ['number', 'text'],
  boolean: ['boolean', 'text'],
}

export function areTypesCompatible(outputType: PortType, inputType: PortType): boolean {
  return TYPE_COMPAT[outputType]?.includes(inputType) ?? false
}

/** Default ports for new nodes */
export const DEFAULT_INPUT_PORTS: IOPort[] = [
  { key: 'input', label: 'Input', type: 'text', required: true },
]

export const DEFAULT_OUTPUT_PORTS: IOPort[] = [
  { key: 'output', label: 'Output', type: 'text', required: true },
]
