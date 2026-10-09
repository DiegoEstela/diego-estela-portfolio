import { describe, expect, it } from 'vitest'
import {
  AGENT_IDS,
  CHARACTER_SIZE,
  DECOR,
  MONITOR_SIZE,
  characterLayers,
  monitorSprite,
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
