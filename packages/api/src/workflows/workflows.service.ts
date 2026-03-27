import { eq, desc, asc } from 'drizzle-orm'
import type { Db } from '../db'
import { workflows, workflowSteps, aiNodes } from '../db/schema'
import { DEFAULT_INPUT_PORTS, DEFAULT_OUTPUT_PORTS, type IOPort } from '../types/io-ports'

function parsePortsJson(json: string | null | undefined, fallback: IOPort[]): IOPort[] {
  if (!json || json === '[]') return fallback
  try {
    const parsed = JSON.parse(json)
    return Array.isArray(parsed) && parsed.length > 0 ? parsed : fallback
  } catch {
    return fallback
  }
}

export interface CreateWorkflowInput {
  name: string
  description?: string
}

export interface UpdateWorkflowInput {
  name?: string
  description?: string
}

export class WorkflowsService {
  constructor(private readonly db: Db) {}

  async list() {
    const allWorkflows = await this.db.select().from(workflows).orderBy(desc(workflows.createdAt))
    const allSteps = await this.db.select().from(workflowSteps).orderBy(asc(workflowSteps.position))

    return allWorkflows.map((w) => ({
      ...w,
      stepCount: allSteps.filter((s) => s.workflowId === w.id).length,
    }))
  }

  async get(id: number) {
    const rows = await this.db.select().from(workflows).where(eq(workflows.id, id)).limit(1)
    const workflow = rows[0] ?? null
    if (!workflow) return null

    const steps = await this.db
      .select({
        id: workflowSteps.id,
        workflowId: workflowSteps.workflowId,
        nodeId: workflowSteps.nodeId,
        position: workflowSteps.position,
        config: workflowSteps.config,
        node: {
          id: aiNodes.id,
          name: aiNodes.name,
          description: aiNodes.description,
          model: aiNodes.model,
          systemPrompt: aiNodes.systemPrompt,
          inputType: aiNodes.inputType,
          outputType: aiNodes.outputType,
          inputPorts: aiNodes.inputPorts,
          outputPorts: aiNodes.outputPorts,
          color: aiNodes.color,
          icon: aiNodes.icon,
        },
      })
      .from(workflowSteps)
      .innerJoin(aiNodes, eq(workflowSteps.nodeId, aiNodes.id))
      .where(eq(workflowSteps.workflowId, id))
      .orderBy(asc(workflowSteps.position))

    const enrichedSteps = steps.map((s) => ({
      ...s,
      config: s.config ? JSON.parse(s.config) : null,
      node: {
        ...s.node,
        inputPorts: parsePortsJson(s.node.inputPorts, DEFAULT_INPUT_PORTS),
        outputPorts: parsePortsJson(s.node.outputPorts, DEFAULT_OUTPUT_PORTS),
      },
    }))

    return { ...workflow, steps: enrichedSteps }
  }

  async create(input: CreateWorkflowInput) {
    const now = new Date().toISOString()
    const result = await this.db
      .insert(workflows)
      .values({
        name: input.name,
        description: input.description ?? '',
        createdAt: now,
        updatedAt: now,
      })
      .returning()
    return result[0]
  }

  async update(id: number, input: UpdateWorkflowInput) {
    const sets: Record<string, unknown> = { updatedAt: new Date().toISOString() }
    if (input.name !== undefined) sets.name = input.name
    if (input.description !== undefined) sets.description = input.description

    await this.db.update(workflows).set(sets).where(eq(workflows.id, id))
    return this.get(id)
  }

  async delete(id: number) {
    await this.db.delete(workflowSteps).where(eq(workflowSteps.workflowId, id))
    await this.db.delete(workflows).where(eq(workflows.id, id))
  }

  async addStep(workflowId: number, nodeId: number, position?: number) {
    const existingSteps = await this.db
      .select()
      .from(workflowSteps)
      .where(eq(workflowSteps.workflowId, workflowId))
      .orderBy(asc(workflowSteps.position))

    const pos = position ?? existingSteps.length

    // shift steps at or after the target position
    for (const step of existingSteps) {
      if (step.position >= pos) {
        await this.db
          .update(workflowSteps)
          .set({ position: step.position + 1 })
          .where(eq(workflowSteps.id, step.id))
      }
    }

    const result = await this.db
      .insert(workflowSteps)
      .values({ workflowId, nodeId, position: pos })
      .returning()

    await this.db
      .update(workflows)
      .set({ updatedAt: new Date().toISOString() })
      .where(eq(workflows.id, workflowId))

    return result[0]
  }

  async removeStep(stepId: number) {
    const rows = await this.db.select().from(workflowSteps).where(eq(workflowSteps.id, stepId)).limit(1)
    const step = rows[0]
    if (!step) return

    await this.db.delete(workflowSteps).where(eq(workflowSteps.id, stepId))

    // re-compact positions
    const remaining = await this.db
      .select()
      .from(workflowSteps)
      .where(eq(workflowSteps.workflowId, step.workflowId))
      .orderBy(asc(workflowSteps.position))

    for (let i = 0; i < remaining.length; i++) {
      if (remaining[i].position !== i) {
        await this.db
          .update(workflowSteps)
          .set({ position: i })
          .where(eq(workflowSteps.id, remaining[i].id))
      }
    }

    await this.db
      .update(workflows)
      .set({ updatedAt: new Date().toISOString() })
      .where(eq(workflows.id, step.workflowId))
  }

  async reorderSteps(workflowId: number, stepIds: number[]) {
    for (let i = 0; i < stepIds.length; i++) {
      await this.db
        .update(workflowSteps)
        .set({ position: i })
        .where(eq(workflowSteps.id, stepIds[i]))
    }

    await this.db
      .update(workflows)
      .set({ updatedAt: new Date().toISOString() })
      .where(eq(workflows.id, workflowId))
  }

  async updateStepConfig(stepId: number, config: Record<string, unknown>) {
    const rows = await this.db.select().from(workflowSteps).where(eq(workflowSteps.id, stepId)).limit(1)
    const step = rows[0]
    if (!step) return null

    await this.db
      .update(workflowSteps)
      .set({ config: JSON.stringify(config) })
      .where(eq(workflowSteps.id, stepId))

    await this.db
      .update(workflows)
      .set({ updatedAt: new Date().toISOString() })
      .where(eq(workflows.id, step.workflowId))

    return this.get(step.workflowId)
  }
}
