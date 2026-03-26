import { eq, desc } from 'drizzle-orm'
import type { Db } from '../db'
import { aiNodes } from '../db/schema'

export interface CreateNodeInput {
  name: string
  description?: string
  model?: string
  systemPrompt: string
  inputType?: string
  outputType?: string
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
  color?: string
  icon?: string
}

export class NodesService {
  constructor(private readonly db: Db) {}

  async list() {
    return this.db.select().from(aiNodes).orderBy(desc(aiNodes.createdAt))
  }

  async get(id: number) {
    const rows = await this.db.select().from(aiNodes).where(eq(aiNodes.id, id)).limit(1)
    return rows[0] ?? null
  }

  async create(input: CreateNodeInput) {
    const result = await this.db
      .insert(aiNodes)
      .values({
        name: input.name,
        description: input.description ?? '',
        model: input.model ?? 'gpt-4o',
        systemPrompt: input.systemPrompt,
        inputType: input.inputType ?? 'text',
        outputType: input.outputType ?? 'text',
        color: input.color ?? '#9ba8ff',
        icon: input.icon ?? 'smart_toy',
      })
      .returning()
    return result[0]
  }

  async update(id: number, input: UpdateNodeInput) {
    const sets: Record<string, unknown> = {}
    if (input.name !== undefined) sets.name = input.name
    if (input.description !== undefined) sets.description = input.description
    if (input.model !== undefined) sets.model = input.model
    if (input.systemPrompt !== undefined) sets.systemPrompt = input.systemPrompt
    if (input.inputType !== undefined) sets.inputType = input.inputType
    if (input.outputType !== undefined) sets.outputType = input.outputType
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
