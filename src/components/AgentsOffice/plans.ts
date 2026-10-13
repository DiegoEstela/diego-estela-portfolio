export interface PlanTask {
  title: string
  done: boolean
}

export interface Plan {
  /** Number of the issue the plan belongs to, taken from the file name (`24-feat-….md`). */
  issue: number
  title: string
  issueUrl: string | null
  tasks: PlanTask[]
}

/** Plans are written in Spanish and follow the template of `/new-feature`. */
const TITLE = /^#\s+(?:Plan:\s*)?(.+?)(?:\s*\(#\d+\))?\s*$/
const ISSUE_URL = /^-\s+\*\*Issue:\*\*\s*(\S+)/
const TASK = /^###\s+Tarea\s+\d+:\s*(.+?)\s*$/
const DONE = /^-\s+\[x\]\s+Hecho\b/i
const ANY_HEADING = /^#{1,3}\s/

/**
 * Reads what the office needs from a plan: its title, the link to its issue and every task with
 * its state. A task is done when its own block holds a `- [x] Hecho` line; other checkboxes of
 * the document (acceptance criteria, risks) are not tasks. Returns null without a title.
 */
export function parsePlan(source: string, issue: number): Plan | null {
  const lines = source.replace(/\r\n/g, '\n').split('\n')

  const heading = lines.find((line) => /^#\s/.test(line))
  const title = heading?.match(TITLE)?.[1]
  if (!title) return null

  const issueUrl = lines.map((line) => line.match(ISSUE_URL)?.[1]).find(Boolean) ?? null

  const tasks: PlanTask[] = []
  // The task whose block we are in. The next heading closes it: a "Hecho" line further down
  // (say, in the risks section) is not its own.
  let current: PlanTask | null = null
  for (const line of lines) {
    const taskTitle = line.match(TASK)?.[1]
    if (taskTitle) {
      current = { title: taskTitle, done: false }
      tasks.push(current)
    } else if (ANY_HEADING.test(line)) {
      current = null
    } else if (current && DONE.test(line)) {
      current.done = true
    }
  }

  return { issue, title, issueUrl, tasks }
}

/** `24-feat-agents-office-v2.md` -> 24. Plans written without an issue (`/plan-tdd`) have none. */
export function planIssueNumber(fileName: string): number | null {
  const match = fileName.split('/').pop()?.match(/^(\d+)-/)
  return match ? Number(match[1]) : null
}

export function progress(plan: Plan): { done: number; total: number } {
  return { done: plan.tasks.filter((task) => task.done).length, total: plan.tasks.length }
}

/** The plan of the highest issue number: the work the repository is on now. */
export function latestPlan(plans: readonly Plan[]): Plan | null {
  return plans.reduce<Plan | null>((latest, plan) => (latest === null || plan.issue > latest.issue ? plan : latest), null)
}

// Read at build time, so the board always shows what the repository really holds.
const files = import.meta.glob('../../../docs/plans/*.md', {
  query: '?raw',
  import: 'default',
  eager: true,
}) as Record<string, string>

export function loadPlans(): Plan[] {
  return Object.entries(files)
    .flatMap(([path, source]) => {
      const issue = planIssueNumber(path)
      const plan = issue === null ? null : parsePlan(source, issue)
      return plan ? [plan] : []
    })
    .sort((a, b) => a.issue - b.issue)
}
