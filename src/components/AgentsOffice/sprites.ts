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

/* ── Resting poses ──────────────────────────────────────────────────────── */

/** Part of the team naps and the rest drink a coffee, so the sofa does not look like a copy. */
export const REST_POSE: Record<AgentId, 'sleep' | 'coffee'> = {
  claude: 'coffee',
  'code-reviewer': 'sleep',
  'content-copywriter': 'sleep',
  'web-quality-auditor': 'coffee',
  'security-auditor': 'sleep',
}

/** Eyelids: the skin tone, darker, so a sleeper keeps the face and loses the eyes. */
function darken(hex: string, amount: number): string {
  const channel = (offset: number) =>
    Math.round(parseInt(hex.slice(offset, offset + 2), 16) * (1 - amount))
      .toString(16)
      .padStart(2, '0')
  return `#${channel(1)}${channel(3)}${channel(5)}`
}

const ZZZ: Sprite = {
  rows: ['.......zzz', '........z.', '.......zzz', ...blankRows(9)],
  palette: { z: '#E2E8F0' },
}

const MUG: Sprite = {
  rows: [...blankRows(7), '........s.', '.......mm.', '.......mmm', ...blankRows(2)],
  palette: { s: '#CBD5E1', m: '#F8FAFC' },
}

/** The same character, with the same accessory, drawn for the sofa: asleep or with a coffee. */
export function restingLayers(id: AgentId): Sprite[] {
  const look = LOOKS[id]
  const asleep = REST_POSE[id] === 'sleep'
  const [base, accessory] = characterLayers(id)
  return [
    asleep ? { ...base, palette: { ...base.palette, E: darken(look.skin, 0.4) } } : base,
    accessory,
    asleep ? ZZZ : MUG,
  ]
}

/* ── Sofa ───────────────────────────────────────────────────────────────── */

/** A seat every 20 units, the width of a touch target; a seam falls between two seats. */
const SEAT_WIDTH = 20

/**
 * A long sofa in two layers: the back goes behind the characters and the seat in front of
 * them, so whoever sits is hidden from the waist down.
 */
export function sofaSprites(width: number): { back: Sprite; seat: Sprite } {
  const seams = (row: string, letter: string) =>
    row
      .split('')
      .map((c, x) => (x > 0 && x < width - 1 && x % SEAT_WIDTH === 0 ? letter : c))
      .join('')
  const full = (letter: string) => letter.repeat(width)
  const cushion = seams('AAA' + 'C'.repeat(Math.max(0, width - 6)) + 'AAA', 's')
  const legs = '..LL' + '.'.repeat(Math.max(0, width - 8)) + 'LL..'

  return {
    back: {
      rows: ['.' + 'B'.repeat(Math.max(0, width - 2)) + '.', seams(full('B'), 's'), seams(full('B'), 's'), seams(full('B'), 's')],
      palette: { B: '#8B4A5C', s: '#6E3446' },
    },
    seat: {
      rows: [cushion, cushion, cushion, full('D'), legs.slice(0, width), legs.slice(0, width)],
      palette: { A: '#A5596E', C: '#B96A80', s: '#8B4A5C', D: '#4A2331', L: '#2B1620' },
    },
  }
}

/* ── Plan board ─────────────────────────────────────────────────────────── */

export const BOARD_SIZE = { width: 18, height: 9 } as const
const BAR_CELLS = 14

/**
 * Cells of the progress bar to fill. A bar is full only when every task is done: 12 of 13
 * rounds to 13 cells, never to 14, so "almost" never reads as "finished".
 */
export function boardFilledCells(done: number, total: number): number {
  if (total <= 0 || done <= 0) return 0
  if (done >= total) return BAR_CELLS
  return Math.min(BAR_CELLS - 1, Math.round((BAR_CELLS * done) / total))
}

/** The board of the wall: sticky notes on top and, below them, a bar with the plan's progress. */
export function boardSprite(done: number, total: number): Sprite {
  const filled = boardFilledCells(done, total)
  const bar = 'p' + 'f'.repeat(filled) + 't'.repeat(BAR_CELLS - filled) + 'p'
  const interior = [
    'ppyyppooopppggpp',
    'ppyyppooopppggpp',
    'pppppppppppppppp',
    'pppppppppppppppp',
    'pppppppppppppppp',
    bar,
    'pppppppppppppppp',
  ]
  return {
    rows: ['B'.repeat(BOARD_SIZE.width), ...interior.map((row) => `B${row}B`), 'B'.repeat(BOARD_SIZE.width)],
    palette: { B: '#475569', p: '#F8FAFC', y: '#FDE047', o: '#FB923C', g: '#4ADE80', t: '#CBD5E1', f: '#15803D' },
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
