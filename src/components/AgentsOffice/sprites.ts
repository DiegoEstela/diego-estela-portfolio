/**
 * Pixel art drawn with code. A sprite is a grid of letters plus a palette; `.` is transparent.
 * No image files: it scales without blurring, weighs a few KB and has no licensing to track.
 */

export interface Sprite {
  rows: readonly string[]
  palette: Readonly<Record<string, string>>
}

export interface Rect {
  x: number
  y: number
  width: number
  height: number
  fill: string
}

const TRANSPARENT = '.'

/** Turns a sprite into SVG rectangles, merging contiguous pixels of the same color in a row. */
export function spriteToRects(
  rows: readonly string[],
  palette: Readonly<Record<string, string>>,
  offset: { x: number; y: number } = { x: 0, y: 0 },
): Rect[] {
  const rects: Rect[] = []
  rows.forEach((row, y) => {
    let x = 0
    while (x < row.length) {
      const letter = row[x]
      if (letter === TRANSPARENT) {
        x++
        continue
      }
      const fill = palette[letter]
      if (fill === undefined) throw new Error(`Sprite uses "${letter}" at row ${y}, but it is not in the palette`)

      let end = x + 1
      while (end < row.length && row[end] === letter) end++
      rects.push({ x: offset.x + x, y: offset.y + y, width: end - x, height: 1, fill })
      x = end
    }
  })
  return rects
}

/* ── Characters ─────────────────────────────────────────────────────────── */

export const AGENT_IDS = [
  'claude',
  'code-reviewer',
  'content-copywriter',
  'web-quality-auditor',
  'security-auditor',
] as const
export type AgentId = (typeof AGENT_IDS)[number]

export const CHARACTER_SIZE = { width: 10, height: 12 } as const
export const MONITOR_SIZE = { width: 12, height: 8 } as const

// Three blank rows on top leave room for antennas and hats.
const BASE_ROWS = [
  '..........',
  '..........',
  '..........',
  '..HHHHHH..',
  '.HHHHHHHH.',
  '.HSSSSSSH.',
  '.SSESSESS.',
  '.SSSSSSSS.',
  '..SSSSSS..',
  '.CCCCCCCC.',
  'CCCCCCCCCC',
  'CDCCCCCCDC',
] as const

const BLANK = '..........'
const blankRows = (count: number) => Array.from({ length: count }, () => BLANK)

type AccessoryId = 'antenna' | 'glasses' | 'beret' | 'visor' | 'badge'

const ACCESSORIES: Record<AccessoryId, Sprite> = {
  antenna: {
    rows: ['....LL....', '.....K....', '.....K....', ...blankRows(9)],
    palette: { L: '#FDE68A', K: '#94A3B8' },
  },
  glasses: {
    rows: [...blankRows(6), '.GGEGGEGG.', ...blankRows(5)],
    palette: { G: '#0F172A', E: '#1E293B' },
  },
  beret: {
    rows: [...blankRows(2), '...BBBB...', '..BBBBBB..', ...blankRows(8)],
    palette: { B: '#E11D48' },
  },
  visor: {
    rows: [...blankRows(4), '.VVVVVVVV.', ...blankRows(7)],
    palette: { V: '#22D3EE' },
  },
  badge: {
    rows: [...blankRows(10), '...ZZZZ...', '...ZYYZ...'],
    palette: { Z: '#FBBF24', Y: '#92400E' },
  },
}

interface Look {
  hair: string
  skin: string
  shirt: string
  shade: string
  accessory: AccessoryId
  /** Dark tint of the screen background and the bright color of its code lines. */
  screen: string
  glow: string
}

const LOOKS: Record<AgentId, Look> = {
  claude: { hair: '#3F2A1D', skin: '#F2C29B', shirt: '#D97757', shade: '#B45A3C', accessory: 'antenna', screen: '#3B2418', glow: '#D97757' },
  'code-reviewer': { hair: '#1F2937', skin: '#C98B5B', shirt: '#4A9FD9', shade: '#2F7FB5', accessory: 'glasses', screen: '#0F2A3F', glow: '#4A9FD9' },
  'content-copywriter': { hair: '#7C2D12', skin: '#F5D0B0', shirt: '#E879A8', shade: '#C25B88', accessory: 'beret', screen: '#3A1526', glow: '#E879A8' },
  'web-quality-auditor': { hair: '#111827', skin: '#8D5A3B', shirt: '#4ADE80', shade: '#2EAD5E', accessory: 'visor', screen: '#0C2E1A', glow: '#4ADE80' },
  'security-auditor': { hair: '#6B7280', skin: '#B07850', shirt: '#A78BFA', shade: '#7F62D6', accessory: 'badge', screen: '#241A45', glow: '#A78BFA' },
}

/** Base character first, accessory on top: draw the layers in order. */
export function characterLayers(id: AgentId): Sprite[] {
  const look = LOOKS[id]
  return [
    {
      rows: BASE_ROWS,
      palette: { H: look.hair, S: look.skin, E: '#1E293B', C: look.shirt, D: look.shade },
    },
    ACCESSORIES[look.accessory],
  ]
}

export function monitorSprite(id: AgentId): Sprite {
  const look = LOOKS[id]
  return {
    rows: [
      'FFFFFFFFFFFF',
      'FGGGGGGGGGGF',
      'FGLLLGGGGGGF',
      'FGGGGLLLGGGF',
      'FGLLGGGGGGGF',
      'FGGGGGGGGGGF',
      'FFFFFFFFFFFF',
      '....FFFF....',
    ],
    palette: { F: '#1E293B', G: look.screen, L: look.glow },
  }
}

/* ── Decor ──────────────────────────────────────────────────────────────── */

export const DECOR: Record<'desk' | 'plant' | 'window' | 'board' | 'floorTile', Sprite> = {
  desk: {
    rows: [
      'TTTTTTTTTTTTTTTT',
      'TTTTTkkkkkkTTTTT',
      'WWWWWWWWWWWWWWWW',
      'WW............WW',
    ],
    palette: { T: '#92643C', k: '#334155', W: '#6B4A2B' },
  },
  plant: {
    rows: ['..gg..', '.gggg.', 'gggggg', '.gGgg.', '..gg..', '.pppp.', '.pppp.', '..pp..'],
    palette: { g: '#4ADE80', G: '#22A55B', p: '#B45309' },
  },
  window: {
    rows: [
      'ffffffffffffff',
      'fsssssffsssssf',
      'fsccssffsssssf',
      'fsssssffsssssf',
      'ffffffffffffff',
      'fsssssffsssssf',
      'fsssssffsscssf',
      'fsssssffsssssf',
      'ffffffffffffff',
    ],
    palette: { f: '#64748B', s: '#7DD3FC', c: '#E0F2FE' },
  },
  // A kanban board: the issue → plan → review flow, in sticky notes.
  board: {
    rows: [
      'BBBBBBBBBBBBBBBBBB',
      'BwwwwwBwwwwwBwwwwB',
      'BwyywwBwooowBwggwB',
      'BwwwwwBwooowBwggwB',
      'BwwwwwBwwwwwBwggwB',
      'BwyywwBwwwwwBwwwwB',
      'BwyywwBwwwwwBwwwwB',
      'BwwwwwBwwwwwBwwwwB',
      'BBBBBBBBBBBBBBBBBB',
    ],
    palette: { B: '#475569', w: '#F8FAFC', y: '#FDE047', o: '#FB923C', g: '#4ADE80' },
  },
  floorTile: {
    rows: ['aaaabbbb', 'aaaabbbb', 'aaaabbbb', 'aaaabbbb', 'bbbbaaaa', 'bbbbaaaa', 'bbbbaaaa', 'bbbbaaaa'],
    palette: { a: '#2A3550', b: '#26304A' },
  },
}
