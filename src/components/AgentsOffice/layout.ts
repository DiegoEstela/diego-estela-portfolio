import type { AgentId } from './sprites'

/**
 * The scene is drawn on a 112x72 grid; one unit is one "pixel" of the art. It is kept small on
 * purpose: the fewer units across, the bigger every character looks on a phone.
 */
export const SCENE_SIZE = { width: 112, height: 72 } as const

/** Touch target of each character, in scene units (>= 44 css px on a 360px phone). */
export const HIT = { width: 20, height: 24 } as const

export const WALL_HEIGHT = 20

/** Top-center of each character. Reading order: top row left to right, then the bottom row. */
export const STATIONS: Record<AgentId, { cx: number; y: number }> = {
  claude: { cx: 20, y: 22 },
  'code-reviewer': { cx: 56, y: 22 },
  'content-copywriter': { cx: 92, y: 22 },
  'web-quality-auditor': { cx: 38, y: 47 },
  'security-auditor': { cx: 74, y: 47 },
}
