import { eq, desc } from 'drizzle-orm'
import type { Db } from '../db'
import { pipelineRuns } from '../db/schema'

export interface CreateRunInput {
  projectName: string
  projectPath: string
  branch: string
  debugMode: boolean
}

export class RunsService {
  constructor(private readonly db: Db) {}

  async create(input: CreateRunInput) {
    const result = await this.db
      .insert(pipelineRuns)
      .values({
        projectName: input.projectName,
        projectPath: input.projectPath,
        branch: input.branch,
        debugMode: input.debugMode,
        status: 'pending',
        createdAt: new Date().toISOString(),
      })
      .returning({ id: pipelineRuns.id })

    return { id: result[0].id }
  }

  async list() {
    return this.db
      .select()
      .from(pipelineRuns)
      .orderBy(desc(pipelineRuns.createdAt))
  }

  async get(id: number) {
    const rows = await this.db
      .select()
      .from(pipelineRuns)
      .where(eq(pipelineRuns.id, id))
      .limit(1)
    return rows[0] ?? null
  }
}
