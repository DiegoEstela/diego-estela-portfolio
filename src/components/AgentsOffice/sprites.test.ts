import { describe, expect, it } from 'vitest'
import {
  AGENT_IDS,
  CHARACTER_SIZE,
  DECOR,
  BOARD_BAR,
  BOARD_SIZE,
  MONITOR_SIZE,
  REST_POSE,
  boardFilledCells,
  boardSprite,
  characterLayers,
  monitorSprite,
  restingLayers,
  sofaSprites,
  spriteToRects,
  type Sprite,
} from './sprites'

const palette = { A: '#111111', B: '#222222' }

describe('spriteToRects', () => {
  it('merges contiguous pixels of the same color into one rectangle', () => {
    expect(spriteToRects(['AAB'], palette)).toEqual([
      { x: 0, y: 0, width: 2, height: 1, fill: '#111111' },
      { x: 2, y: 0, width: 1, height: 1, fill: '#222222' },
    ])
  })

  it('skips transparent pixels and splits a run around them', () => {
    expect(spriteToRects(['A.A'], palette)).toEqual([
      { x: 0, y: 0, width: 1, height: 1, fill: '#111111' },
      { x: 2, y: 0, width: 1, height: 1, fill: '#111111' },
    ])
  })

  it('places each row at its own y', () => {
    const rects = spriteToRects(['A', 'B'], palette)
    expect(rects.map((r) => [r.y, r.fill])).toEqual([
      [0, '#111111'],
      [1, '#222222'],
    ])
  })

  it('applies an offset to every rectangle', () => {
    expect(spriteToRects(['A'], palette, { x: 5, y: 7 })).toEqual([
      { x: 5, y: 7, width: 1, height: 1, fill: '#111111' },
    ])
  })

  it('throws a helpful error for a letter that is not in the palette', () => {
    expect(() => spriteToRects(['AZ'], palette)).toThrowError(/"Z"/)
  })

  it('returns nothing for an empty sprite', () => {
    expect(spriteToRects([], palette)).toEqual([])
    expect(spriteToRects(['...'], palette)).toEqual([])
  })
})

function assertWellFormed(name: string, sprite: Sprite, width?: number, height?: number) {
  const expectedWidth = width ?? sprite.rows[0].length
  if (height !== undefined) expect(sprite.rows.length, `${name} height`).toBe(height)
  sprite.rows.forEach((row, index) => {
    expect(row.length, `${name} row ${index} width`).toBe(expectedWidth)
    for (const letter of row) {
      if (letter !== '.') expect(sprite.palette, `${name} row ${index} letter "${letter}"`).toHaveProperty(letter)
    }
  })
}

describe('decor sprites', () => {
  it.each(Object.entries(DECOR))('%s is rectangular and only uses its palette', (name, sprite) => {
    assertWellFormed(name, sprite)
  })

  it('defines the pieces the scene needs', () => {
    expect(Object.keys(DECOR).sort()).toEqual(['board', 'desk', 'floorTile', 'plant', 'window'])
  })
})

describe('agents', () => {
  it('has the orchestrator and the four real agents, in a stable order', () => {
    expect(AGENT_IDS).toEqual([
      'claude',
      'code-reviewer',
      'content-copywriter',
      'web-quality-auditor',
      'security-auditor',
    ])
  })

  it.each(AGENT_IDS)('%s has a well formed character and monitor', (id) => {
    for (const [index, layer] of characterLayers(id).entries()) {
      assertWellFormed(`${id} layer ${index}`, layer, CHARACTER_SIZE.width, CHARACTER_SIZE.height)
    }
    assertWellFormed(`${id} monitor`, monitorSprite(id), MONITOR_SIZE.width, MONITOR_SIZE.height)
  })

  it('gives every agent a distinct look, so they can be told apart', () => {
    const looks = AGENT_IDS.map((id) => JSON.stringify(characterLayers(id)))
    expect(new Set(looks).size).toBe(AGENT_IDS.length)
    const screens = AGENT_IDS.map((id) => monitorSprite(id).palette.G)
    expect(new Set(screens).size).toBe(AGENT_IDS.length)
  })

  it('draws the base character first, so accessories end up on top', () => {
    const [base, ...accessories] = characterLayers('claude')
    expect(base.rows.join('')).toContain('H')
    expect(accessories.length).toBeGreaterThan(0)
  })
})

describe('resting poses', () => {
  it.each(AGENT_IDS)('%s has a well formed resting pose', (id) => {
    for (const [index, layer] of restingLayers(id).entries()) {
      assertWellFormed(`${id} resting layer ${index}`, layer, CHARACTER_SIZE.width, CHARACTER_SIZE.height)
    }
  })

  it.each(AGENT_IDS)('%s looks different when resting than when working', (id) => {
    expect(JSON.stringify(restingLayers(id))).not.toBe(JSON.stringify(characterLayers(id)))
  })

  it('keeps every agent recognizable while resting', () => {
    const looks = AGENT_IDS.map((id) => JSON.stringify(restingLayers(id)))
    expect(new Set(looks).size).toBe(AGENT_IDS.length)
  })

  it('has some of the team asleep and some awake with a coffee', () => {
    const poses = AGENT_IDS.map((id) => REST_POSE[id])
    expect(poses).toContain('sleep')
    expect(poses).toContain('coffee')
  })

  it('shows the sleepers with a zZz and the others with a cup', () => {
    for (const id of AGENT_IDS) {
      const letters = restingLayers(id).flatMap((layer) => layer.rows).join('')
      if (REST_POSE[id] === 'sleep') {
        expect(letters, id).toContain('z')
        expect(letters, id).not.toContain('m')
      } else {
        expect(letters, id).toContain('m')
        expect(letters, id).not.toContain('z')
      }
    }
  })

  it('draws the base character first, so the overlay ends up on top', () => {
    const [base] = restingLayers('claude')
    expect(base.rows.join('')).toContain('H')
  })
})

describe('sofa', () => {
  it.each([40, 100])('is rectangular at a width of %i, in two layers', (width) => {
    const { back, seat } = sofaSprites(width)
    assertWellFormed('sofa back', back, width)
    assertWellFormed('sofa seat', seat, width)
  })

  it('draws a seat that is taller than the back rest is thick, so it can hide the legs of whoever sits', () => {
    const { back, seat } = sofaSprites(60)
    expect(seat.rows.length).toBeGreaterThanOrEqual(4)
    expect(back.rows.length).toBeGreaterThanOrEqual(3)
  })
})

describe('plan board', () => {
  it('has the same size whatever the progress', () => {
    for (const [done, total] of [[0, 0], [0, 13], [7, 13], [13, 13]] as const) {
      assertWellFormed(`board ${done}/${total}`, boardSprite(done, total), BOARD_SIZE.width, BOARD_SIZE.height)
    }
  })

  it.each([
    [0, 13, 0],
    [1, 13, 1],
    [7, 13, 8],
    [12, 13, 13],
    [13, 13, 14],
    [0, 0, 0],
    [5, 0, 0],
    [20, 13, 14],
  ])('fills the bar for %i of %i tasks with %i cells', (done, total, cells) => {
    expect(boardFilledCells(done, total)).toBe(cells)
  })

  it('never shows a full bar until every task is done', () => {
    expect(boardFilledCells(12, 13)).toBeLessThan(boardFilledCells(13, 13))
    expect(boardFilledCells(99, 100)).toBeLessThan(boardFilledCells(100, 100))
  })

  it('tells where the bar starts, so other drawings can fill it', () => {
    const { rows } = boardSprite(0, 1)
    expect(rows[BOARD_BAR.y][BOARD_BAR.x]).toBe('t')
    expect(rows[BOARD_BAR.y][BOARD_BAR.x - 1]).toBe('p')
    expect(rows[BOARD_BAR.y].slice(BOARD_BAR.x).replace(/p/, '').length).toBeGreaterThanOrEqual(boardFilledCells(1, 1))
  })

  it('paints exactly the filled cells in the bar', () => {
    for (const [done, total] of [[0, 13], [1, 13], [7, 13], [13, 13]] as const) {
      const sprite = boardSprite(done, total)
      const painted = sprite.rows.join('').split('').filter((letter) => letter === 'f').length
      expect(painted, `${done}/${total}`).toBe(boardFilledCells(done, total))
    }
  })
})
