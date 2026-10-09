import type { AgentId } from './sprites'

/**
 * The scene is drawn on a 112x72 grid; one unit is one "pixel" of the art. It is kept small on
 * purpose: the fewer units across, the bigger every character looks on a phone.
 */
export const SCENE_SIZE = { width: 112, height: 72 } as const

/** Touch target of each character, in scene units (>= 44 css px on a 360px phone). */
export const HIT = { width: 20, height: 24 } as const

export const WALL_HEIGHT = 20

/**
 * Top-center of each character, and the line where the bottom of its speech bubble rests.
 * Reading order: top row left to right, then the bottom row. A top-row bubble sits on the wall,
 * above the head; a bottom-row one rests just under the top row's heads, over their desks.
 */
export const STATIONS: Record<AgentId, { cx: number; y: number; bubbleY: number }> = {
  claude: { cx: 20, y: 22, bubbleY: 21 },
  'code-reviewer': { cx: 56, y: 22, bubbleY: 21 },
  'content-copywriter': { cx: 92, y: 22, bubbleY: 21 },
  'web-quality-auditor': { cx: 38, y: 47, bubbleY: 49 },
  'security-auditor': { cx: 74, y: 47, bubbleY: 49 },
}

/** Speech bubble width, in scene units (about 140 css px on a 360px phone). */
export const BUBBLE = { width: 48, height: 16 } as const

/**
 * Where a bubble goes for a character centered at `cx`. The bubble is clamped inside the scene
 * so it never gets cut off at the edges; `tail` is how far its pointer shifts to keep aiming
 * at the character.
 */
export function bubbleAnchor(cx: number) {
  const half = BUBBLE.width / 2
  const left = Math.min(Math.max(cx, half), SCENE_SIZE.width - half)
  return { left, tail: cx - left }
}

/** The back wall of the scene. The scene is dark in both themes, so its colors are fixed. */
export const WALL_COLOR = '#1B2540'

/**
 * Focus and selection ring of the characters. The page accent turns dark in the light theme and
 * would almost vanish against the dark scene, so this one is fixed (8:1 against the wall).
 */
export const FOCUS_RING = '#7EC8E3'
