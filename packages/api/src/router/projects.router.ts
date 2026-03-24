import { readdirSync, statSync } from 'fs'
import { join } from 'path'
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
})
