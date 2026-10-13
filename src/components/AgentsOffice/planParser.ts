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
// "### Tarea 3: X", "### Tarea 3 - X", "### Tarea 3. X" or just "### Tarea 3". A heading that is
// written a little differently must still count, or a plan could look finished with a task missing.
const TASK = /^###\s+Tarea\s+(\d+)\s*[:.\-–—]?\s*(.*?)\s*$/
const DONE = /^-\s+\[x\]\s+Hecho\b/i
const ANY_HEADING = /^#{1,3}\s/
const FENCE = /^\s*(```|~~~)/

/** Only GitHub over https: the link ends up in an href, and the plans are free text. */
function safeIssueUrl(raw: string | undefined): string | null {
  if (!raw) return null
  try {
    const url = new URL(raw)
    return url.protocol === 'https:' && url.hostname === 'github.com' ? raw : null
  } catch {
    return null
  }
}

/** The lines outside fenced code blocks: inside them live `# comments` and examples that look like headings. */
function proseLines(source: string): string[] {
  const lines: string[] = []
  let fence: string | null = null
  // A byte order mark at the start would hide the title from the "# " test below.
  const text = source.charCodeAt(0) === 0xfeff ? source.slice(1) : source
  for (const line of text.replace(/\r\n/g, '\n').split('\n')) {
    const marker = line.match(FENCE)?.[1]
    if (marker && (fence === null || marker === fence)) {
      fence = fence === null ? marker : null
    } else if (fence === null) {
      lines.push(line)
    }
  }
  return lines
}

/**
 * Reads what the office needs from a plan: its title, the link to its issue and every task with
 * its state. A task is done when its own block holds a `- [x] Hecho` line; other checkboxes of
 * the document (acceptance criteria, risks) are not tasks. Returns null without a title.
 */
export function parsePlan(source: string, issue: number): Plan | null {
  const lines = proseLines(source)

  const heading = lines.find((line) => /^#\s/.test(line))
  const title = heading?.match(TITLE)?.[1]
  if (!title) return null

  const issueUrl = safeIssueUrl(lines.map((line) => line.match(ISSUE_URL)?.[1]).find(Boolean))

  const tasks: PlanTask[] = []
  // The task whose block we are in. The next heading closes it: a "Hecho" line further down
  // (say, in the risks section) is not its own.
  let current: PlanTask | null = null
  for (const line of lines) {
    const task = line.match(TASK)
    if (task) {
      current = { title: task[2] || `Tarea ${task[1]}`, done: false }
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
