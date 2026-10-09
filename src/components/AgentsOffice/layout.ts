import type { AgentId } from './sprites'

/** The scene is drawn on a 160x100 grid; one unit is one "pixel" of the art. */
export const SCENE_SIZE = { width: 160, height: 100 } as const

/** Touch target of each character, in scene units (>= 44 css px wide on a 360px phone). */
export const HIT = { width: 24, height: 26 } as const

export const WALL_HEIGHT = 28

/** Top-center of each character. Reading order: top row left to right, then the bottom row. */
export const STATIONS: Record<AgentId, { cx: number; y: number }> = {
  claude: { cx: 32, y: 30 },
  'code-reviewer': { cx: 80, y: 30 },
  'content-copywriter': { cx: 128, y: 30 },
  'web-quality-auditor': { cx: 56, y: 62 },
  'security-auditor': { cx: 104, y: 62 },
}
