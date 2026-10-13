import type { Plan } from '@/components/AgentsOffice/plans'

/**
 * A plan with `total` tasks of which the first `done` are done. Tests use it instead of the real
 * plans of the repository, whose progress changes with every commit.
 */
export function planWithTasks(done: number, total: number, overrides: Partial<Plan> = {}): Plan {
  return {
    issue: 24,
    title: 'Oficina de agentes v2',
    issueUrl: 'https://github.com/DiegoEstela/diego-estela-portfolio/issues/24',
    tasks: Array.from({ length: total }, (_, index) => ({ title: `Tarea ${index + 1}`, done: index < done })),
    ...overrides,
  }
}

/** Work in progress: the team is at their desks. */
export const WORKING_PLAN = planWithTasks(2, 3)

/** Everything done: the team is resting. */
export const FINISHED_PLAN = planWithTasks(3, 3)
