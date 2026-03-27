import { eq, desc } from 'drizzle-orm'
import type { Db } from '../db'
import { aiNodes } from '../db/schema'
import { DEFAULT_INPUT_PORTS, DEFAULT_OUTPUT_PORTS, type IOPort } from '../types/io-ports'

export interface CreateNodeInput {
  name: string
  description?: string
  model?: string
  systemPrompt: string
  inputType?: string
  outputType?: string
  inputPorts?: IOPort[]
  outputPorts?: IOPort[]
  color?: string
  icon?: string
}

export interface UpdateNodeInput {
  name?: string
  description?: string
  model?: string
  systemPrompt?: string
  inputType?: string
  outputType?: string
  inputPorts?: IOPort[]
  outputPorts?: IOPort[]
  color?: string
  icon?: string
}

function parsePortsJson(json: string | null | undefined, fallback: IOPort[]): IOPort[] {
  if (!json || json === '[]') return fallback
  try {
    const parsed = JSON.parse(json)
    return Array.isArray(parsed) && parsed.length > 0 ? parsed : fallback
  } catch {
    return fallback
  }
}

type NodeRow = typeof aiNodes.$inferSelect

function enrichNode(row: NodeRow) {
  return {
    ...row,
    inputPorts: parsePortsJson(row.inputPorts, DEFAULT_INPUT_PORTS),
    outputPorts: parsePortsJson(row.outputPorts, DEFAULT_OUTPUT_PORTS),
  }
}

export class NodesService {
  constructor(private readonly db: Db) {}

  async list() {
    const rows = await this.db.select().from(aiNodes).orderBy(desc(aiNodes.createdAt))
    return rows.map(enrichNode)
  }

  async get(id: number) {
    const rows = await this.db.select().from(aiNodes).where(eq(aiNodes.id, id)).limit(1)
    if (!rows[0]) return null
    return enrichNode(rows[0])
  }

  async create(input: CreateNodeInput) {
    const inputPorts = input.inputPorts ?? DEFAULT_INPUT_PORTS
    const outputPorts = input.outputPorts ?? DEFAULT_OUTPUT_PORTS

    const result = await this.db
      .insert(aiNodes)
      .values({
        name: input.name,
        description: input.description ?? '',
        model: input.model ?? 'gpt-4o',
        systemPrompt: input.systemPrompt,
        inputType: input.inputType ?? 'text',
        outputType: input.outputType ?? 'text',
        inputPorts: JSON.stringify(inputPorts),
        outputPorts: JSON.stringify(outputPorts),
        color: input.color ?? '#9ba8ff',
        icon: input.icon ?? 'smart_toy',
      })
      .returning()
    return enrichNode(result[0])
  }

  async update(id: number, input: UpdateNodeInput) {
    const sets: Record<string, unknown> = {}
    if (input.name !== undefined) sets.name = input.name
    if (input.description !== undefined) sets.description = input.description
    if (input.model !== undefined) sets.model = input.model
    if (input.systemPrompt !== undefined) sets.systemPrompt = input.systemPrompt
    if (input.inputType !== undefined) sets.inputType = input.inputType
    if (input.outputType !== undefined) sets.outputType = input.outputType
    if (input.inputPorts !== undefined) sets.inputPorts = JSON.stringify(input.inputPorts)
    if (input.outputPorts !== undefined) sets.outputPorts = JSON.stringify(input.outputPorts)
    if (input.color !== undefined) sets.color = input.color
    if (input.icon !== undefined) sets.icon = input.icon

    if (Object.keys(sets).length === 0) return this.get(id)

    await this.db.update(aiNodes).set(sets).where(eq(aiNodes.id, id))
    return this.get(id)
  }

  async delete(id: number) {
    await this.db.delete(aiNodes).where(eq(aiNodes.id, id))
  }
}
