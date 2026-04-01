import { eq, desc, and } from 'drizzle-orm'
import { sql } from 'drizzle-orm'
import type { Db } from '../db'
import { tasks } from '../db/schema'

export interface CreateTaskInput {
  name: string
  description?: string
  projectName: string
  projectPath: string
  branch: string
}

export interface UpdateTaskInput {
  name?: string
  description?: string
  branch?: string
}

export class TasksService {
  constructor(private readonly db: Db) {}

  async list(projectPath?: string) {
    const query = this.db.select().from(tasks).orderBy(desc(tasks.createdAt))
    if (projectPath) {
      return query.where(eq(tasks.projectPath, projectPath))
    }
    return query
  }

  async get(id: number) {
    const rows = await this.db.select().from(tasks).where(eq(tasks.id, id)).limit(1)
    return rows[0] ?? null
  }

  async create(input: CreateTaskInput) {
    const now = new Date().toISOString()
    const result = await this.db
      .insert(tasks)
      .values({
        name: input.name,
        description: input.description ?? '',
        projectName: input.projectName,
        projectPath: input.projectPath,
        branch: input.branch,
        createdAt: now,
        updatedAt: now,
      })
      .returning({ id: tasks.id })
    return result[0]
  }

  async update(id: number, input: UpdateTaskInput) {
    const setClauses: Record<string, unknown> = {
      updatedAt: new Date().toISOString(),
    }
    if (input.name !== undefined) setClauses.name = input.name
    if (input.description !== undefined) setClauses.description = input.description
    if (input.branch !== undefined) setClauses.branch = input.branch

    await this.db.update(tasks).set(setClauses).where(eq(tasks.id, id))
    return this.get(id)
  }

  async delete(id: number) {
    await this.db.delete(tasks).where(eq(tasks.id, id))
  }
}
