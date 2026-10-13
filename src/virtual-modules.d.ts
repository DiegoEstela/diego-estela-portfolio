declare module 'virtual:latest-plan' {
  import type { Plan } from '@/components/AgentsOffice/planParser'

  /** The plan of the highest issue number in docs/plans, or null if there is none. */
  const plan: Plan | null
  export default plan
}
