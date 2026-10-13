import latest from 'virtual:latest-plan'
import type { Plan } from './planParser'

/**
 * The latest plan of the repository (the highest issue number in `docs/plans`), read at build
 * time by a Vite plugin that hands over only its title, its link and its tasks. The plans are
 * never imported as text: that would put the prose of every plan in the public bundle.
 */
export const LATEST_PLAN: Plan | null = latest
