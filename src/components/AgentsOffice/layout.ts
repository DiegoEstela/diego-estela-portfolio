import type { OfficeMode } from './officeMode'
import type { AgentId } from './sprites'

/**
 * The scene is drawn on a 112x88 grid; one unit is one "pixel" of the art. It is kept small on
 * purpose: the fewer units across, the bigger every character looks on a phone.
 */
export const SCENE_SIZE = { width: 112, height: 88 } as const

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

export interface Box {
  left: number
  top: number
  right: number
  bottom: number
}

/** Touch target of a character that sits on the sofa. Shorter, to fit under the scene's edge. */
export const REST_HIT = { width: 20, height: 16 } as const

/**
 * Where each character sits when the team rests: one seat per touch target (20 units), left to
 * right in the same reading order as the desks. `y` is the top of the sprite and `bubbleY` the
 * line just above its head, clear of everybody else's.
 */
export const REST_STATIONS: Record<AgentId, { cx: number; y: number; bubbleY: number }> = {
  claude: { cx: 16, y: 71, bubbleY: 70 },
  'code-reviewer': { cx: 36, y: 71, bubbleY: 70 },
  'content-copywriter': { cx: 56, y: 71, bubbleY: 70 },
  'web-quality-auditor': { cx: 76, y: 71, bubbleY: 70 },
  'security-auditor': { cx: 96, y: 71, bubbleY: 70 },
}

/**
 * The sofa: a long bench below the desks, big enough for five seats. `y` is the top of the back
 * rest; the seat front starts `seatOffset` lower and hides the legs of whoever sits.
 */
export const SOFA = { x: 6, y: 78, width: 100, height: 9, seatOffset: 3 } as const

/** Where the board of the wall is drawn, and the touch target around it (the art is smaller than 44 px). */
export const BOARD = { x: 47, y: 5 } as const
export const BOARD_HIT_BOX: Box = { left: 45, top: 2, right: 67, bottom: 18 }

export function stationsFor(mode: OfficeMode) {
  return mode === 'resting' ? REST_STATIONS : STATIONS
}

/** The touch target of a character in the given mode, in scene units. */
export function hitBoxFor(mode: OfficeMode, id: AgentId): Box {
  const { cx, y } = stationsFor(mode)[id]
  if (mode === 'resting') {
    return { left: cx - REST_HIT.width / 2, top: y + 1, right: cx + REST_HIT.width / 2, bottom: y + 1 + REST_HIT.height }
  }
  return { left: cx - HIT.width / 2, top: y, right: cx + HIT.width / 2, bottom: y + HIT.height }
}
