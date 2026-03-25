import { readdirSync, statSync } from 'fs'
import { join } from 'path'
import { z } from 'zod'
import simpleGit from 'simple-git'
import { t } from './trpc'

export const projectsRouter = t.router({
  list: t.procedure.query(async ({ ctx }) => {
    const root = await ctx.configService.get('projectsRoot')

    if (!root) return []

    try {
      const entries = readdirSync(root)
      return entries
        .filter((name) => {
          try {
            return statSync(join(root, name)).isDirectory() && !name.startsWith('.')
          } catch {
            return false
          }
        })
        .map((name) => ({ name, path: join(root, name) }))
    } catch {
      return []
    }
  }),

  branches: t.procedure
    .input(z.object({ path: z.string() }))
    .query(async ({ input }) => {
      const git = simpleGit({ baseDir: input.path, timeout: { block: 5000 } })

      const isRepo = await git.checkIsRepo().catch(() => false)
      if (!isRepo) return { branches: [], isGitRepo: false }

      try {
        const result = await git.branchLocal()
        return { branches: result.all, isGitRepo: true }
      } catch {
        return { branches: [], isGitRepo: true }
      }
    }),
})

