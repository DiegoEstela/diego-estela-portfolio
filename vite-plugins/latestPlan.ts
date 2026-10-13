import { readdirSync, readFileSync } from 'node:fs'
import { join, resolve } from 'node:path'
import type { Plugin } from 'vite'
import { latestPlan, parsePlan, planIssueNumber, type Plan } from '../src/components/AgentsOffice/planParser'

const VIRTUAL_ID = 'virtual:latest-plan'
const RESOLVED_ID = `\0${VIRTUAL_ID}`

/** The plans of a folder: the Markdown files named with an issue number (`24-feat-….md`) that have a title. */
export function readPlans(dir: string): Plan[] {
  return readdirSync(dir)
    .filter((file) => file.endsWith('.md'))
    .flatMap((file) => {
      const issue = planIssueNumber(file)
      const plan = issue === null ? null : parsePlan(readFileSync(join(dir, file), 'utf8'), issue)
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
 */
export function latestPlanPlugin(dir: string = resolve('docs/plans')): Plugin {
  return {
    name: 'latest-plan',
    resolveId(id) {
      return id === VIRTUAL_ID ? RESOLVED_ID : null
    },
    load(id) {
      if (id !== RESOLVED_ID) return null
      // Editing a plan while `npm run dev` runs refreshes the board.
      for (const file of readdirSync(dir)) this.addWatchFile(join(dir, file))
      return latestPlanModule(readPlans(dir))
    },
  }
}
