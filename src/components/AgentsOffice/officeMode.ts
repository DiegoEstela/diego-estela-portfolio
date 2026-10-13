import { progress, type Plan } from './planParser'

export type OfficeMode = 'working' | 'resting'

/**
 * The team rests when the latest plan is finished, and works otherwise. Without a plan, or with
 * a plan that lists no tasks, nothing is finished, so the office looks like the first version.
 */
export function deriveMode(plan: Plan | null): OfficeMode {
  if (!plan) return 'working'
  const { done, total } = progress(plan)
  return total > 0 && done === total ? 'resting' : 'working'
}

/** What the plan says, unless the visitor picked a mode with the toggle. */
export function resolveMode(derived: OfficeMode, override: OfficeMode | null): OfficeMode {
  return override ?? derived
}

export const otherMode = (mode: OfficeMode): OfficeMode => (mode === 'working' ? 'resting' : 'working')
