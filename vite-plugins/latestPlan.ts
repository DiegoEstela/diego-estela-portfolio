import { existsSync, readdirSync, readFileSync } from 'node:fs'
import { join, resolve } from 'node:path'
import { normalizePath, type Plugin } from 'vite'
import { latestPlan, parsePlan, planIssueNumber, type Plan } from '../src/components/AgentsOffice/planParser'

const VIRTUAL_ID = 'virtual:latest-plan'
const RESOLVED_ID = `\0${VIRTUAL_ID}`

/**
 * The plans of a folder: the Markdown files named with an issue number (`24-feat-….md`) that have
 * a title. A folder that does not exist has no plans, which must not break the build.
 */
export function readPlans(dir: string): Plan[] {
  if (!existsSync(dir)) return []
  return readdirSync(dir, { withFileTypes: true })
    .filter((entry) => entry.isFile() && entry.name.endsWith('.md'))
    .flatMap(({ name }) => {
      const issue = planIssueNumber(name)
      const plan = issue === null ? null : parsePlan(readFileSync(join(dir, name), 'utf8'), issue)
      return plan ? [plan] : []
    })
    .sort((a, b) => a.issue - b.issue)
}

/** The source of the virtual module: only the latest plan, as data. No prose reaches the client. */
export function latestPlanModule(plans: readonly Plan[]): string {
  return `export default ${JSON.stringify(latestPlan(plans))}\n`
}

/**
 * Serves `virtual:latest-plan`. The office shows the latest plan of the repository, and it only
 * needs its title, its link and its tasks: shipping the Markdown of every plan would multiply
 * the size of the lazy chunk and publish the text of every plan.
 *
 * Without an explicit folder it uses `docs/plans` under the root of the Vite project, not under
 * wherever the command happened to run.
 */
export function latestPlanPlugin(folder?: string): Plugin {
  let dir = folder ?? resolve('docs/plans')
  return {
    name: 'latest-plan',
    configResolved(config) {
      if (folder === undefined) dir = join(config.root, 'docs', 'plans')
    },
    resolveId(id) {
      return id === VIRTUAL_ID ? RESOLVED_ID : null
    },
    configureServer(server) {
      // A plan created or deleted while `npm run dev` runs: `addWatchFile` below only covers the
      // files that exist when the module loads.
      server.watcher.add(dir)
      const refresh = (file: string) => {
        if (!normalizePath(file).startsWith(`${normalizePath(dir)}/`)) return
        const module = server.moduleGraph.getModuleById(RESOLVED_ID)
        if (!module) return
        server.moduleGraph.invalidateModule(module)
        server.ws.send({ type: 'full-reload' })
      }
      server.watcher.on('add', refresh)
      server.watcher.on('unlink', refresh)
    },
    load(id) {
      if (id !== RESOLVED_ID) return null
      // Files only: Vite resolves what it is asked to watch as an import, so a folder would fail.
      if (existsSync(dir)) {
        for (const entry of readdirSync(dir, { withFileTypes: true })) {
          if (entry.isFile()) this.addWatchFile(join(dir, entry.name))
        }
      }
      return latestPlanModule(readPlans(dir))
    },
  }
}
