import { describe, expect, it } from 'vitest'
import en from '../../locales/en.json'
import { REST_STATIONS, SCENE_SIZE } from './layout'
import { renderOfficeSvg } from './officeSvg'
import { AGENT_IDS, BOARD_BAR_FILL, REST_POSE, boardFilledCells, characterLayers, spriteToRects, type AgentId } from './sprites'

const agents = Object.fromEntries(
  AGENT_IDS.map((id) => [id, { doing: en.agentsOffice.agents[id].doing[0] }]),
) as Record<AgentId, { doing: string }>

const input = { title: en.agentsOffice.sceneDescription, agents }
const svg = renderOfficeSvg(input)
const doc = new DOMParser().parseFromString(svg, 'image/svg+xml')
const css = doc.querySelector('style')?.textContent ?? ''

describe('renderOfficeSvg', () => {
  it('is well-formed XML with the scene size and crisp edges', () => {
    expect(doc.querySelector('parsererror')).toBeNull()
    const root = doc.documentElement
    expect(root.tagName).toBe('svg')
    expect(root.getAttribute('xmlns')).toBe('http://www.w3.org/2000/svg')
    expect(root.getAttribute('viewBox')).toBe(`0 0 ${SCENE_SIZE.width} ${SCENE_SIZE.height}`)
    expect(root.getAttribute('shape-rendering')).toBe('crispEdges')
  })

  it('has an accessible name and no scripts, external resources or page variables', () => {
    expect(doc.querySelector('title')?.textContent).toBe(input.title)
    expect(doc.documentElement.getAttribute('role')).toBe('img')
    expect(svg).not.toMatch(/<script|<foreignObject|href=|url\(http|var\(--|@import/)
  })

  it('draws every character from its real sprite', () => {
    for (const id of AGENT_IDS) {
      const station = doc.querySelector(`[data-agent="${id}"]`)
      expect(station, id).not.toBeNull()
      const fills = new Set([...station!.querySelectorAll('rect')].map((rect) => rect.getAttribute('fill')))
      const palette = characterLayers(id)[0].palette
      for (const color of [palette.H, palette.S, palette.C]) expect(fills, `${id} ${color}`).toContain(color)
    }
  })

  it('merges contiguous pixels like the web scene does', () => {
    const [base] = characterLayers('claude')
    const expected = spriteToRects(base.rows, base.palette).length
    const station = doc.querySelector('[data-agent="claude"] .office-character')!
    // The character group holds the base layer and its accessory, so it can only have more.
    expect(station.querySelectorAll('rect').length).toBeGreaterThanOrEqual(expected)
  })

  it('shows one speech bubble per character with the text it was given', () => {
    for (const id of AGENT_IDS) {
      const bubble = doc.querySelector(`[data-bubble="${id}"]`)
      expect(bubble, id).not.toBeNull()
      const text = [...bubble!.querySelectorAll('text')].map((line) => line.textContent).join(' ')
      expect(text).toBe(agents[id].doing)
    }
  })

  it('wraps long bubble text into lines that fit the bubble', () => {
    const lines = [...doc.querySelectorAll('[data-bubble] text')].map((line) => line.textContent ?? '')
    expect(lines.length).toBeGreaterThan(AGENT_IDS.length)
    for (const line of lines) expect(line.length).toBeLessThanOrEqual(22)
  })

  it('escapes text so it cannot break the document', () => {
    const nasty = renderOfficeSvg({
      title: 'A & B <c>',
      agents: { ...agents, claude: { doing: '"Fix" <b> & go' } },
    })
    const parsed = new DOMParser().parseFromString(nasty, 'image/svg+xml')
    expect(parsed.querySelector('parsererror')).toBeNull()
    expect(parsed.querySelector('title')?.textContent).toBe('A & B <c>')
  })

  it('animates in pixel steps and spotlights the five characters in turn', () => {
    expect(css).toMatch(/@keyframes office-bob/)
    expect(css).toMatch(/steps\(1, end\)/)

    const delays = AGENT_IDS.map((id) => {
      const spot = doc.querySelector(`[data-agent="${id}"] [data-spot]`)
      return Number.parseFloat(spot?.getAttribute('style')?.match(/animation-delay:\s*([\d.]+)s/)?.[1] ?? 'NaN')
    })
    expect(delays).toEqual([...delays].sort((a, b) => a - b))
    expect(new Set(delays).size).toBe(AGENT_IDS.length)
  })

  it('is deterministic', () => {
    expect(renderOfficeSvg(input)).toBe(svg)
  })

  // The README embeds this file. If the sprites change, `npm run docs:office` regenerates it.
  it('matches the committed docs/images/agents-office.svg', async () => {
    await expect(svg).toMatchFileSnapshot('../../../docs/images/agents-office.svg')
  })
})

describe('the board and the sofa in the animation', () => {
  it('hangs the plan board on the wall, with the bar empty underneath the one that fills', () => {
    const board = doc.querySelector('[data-board]')
    expect(board).not.toBeNull()
    const filled = [...board!.querySelectorAll('rect')].filter((r) => r.getAttribute('fill') === BOARD_BAR_FILL && !r.classList.contains('office-bar'))
    expect(filled).toHaveLength(boardFilledCells(0, 1))
  })

  it('fills the bar one pixel at a time, as many steps as the bar has cells', () => {
    const bar = doc.querySelector('[data-board] .office-bar')
    expect(bar).not.toBeNull()
    expect(Number(bar!.getAttribute('width'))).toBe(boardFilledCells(1, 1))
    // The same green as the board of the web scene, from one place, so the two cannot drift apart.
    expect(bar!.getAttribute('fill')).toBe(BOARD_BAR_FILL)
    expect(css).toMatch(/@keyframes office-bar/)
    expect(css).toMatch(new RegExp(`\\.office-bar\\s*\\{[^}]*steps\\(${boardFilledCells(1, 1)}, end\\)`))
  })

  it('draws the sofa, whose seat goes after everybody who sits', () => {
    const back = doc.querySelector('[data-sofa="back"]')!
    const seat = doc.querySelector('[data-sofa="seat"]')!
    const lastSeated = doc.querySelector(`[data-seated="${AGENT_IDS.at(-1)}"]`)!
    expect(back.compareDocumentPosition(lastSeated) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy()
    expect(lastSeated.compareDocumentPosition(seat) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy()
  })
})

describe('the team at rest in the animation', () => {
  it('sits every agent on the sofa, each with its pose', () => {
    for (const id of AGENT_IDS) {
      const seated = doc.querySelector(`[data-seated="${id}"]`)
      expect(seated, id).not.toBeNull()
      expect(seated!.getAttribute('data-pose')).toBe(REST_POSE[id])
      const tops = [...seated!.querySelectorAll('rect')].map((r) => Number(r.getAttribute('y')))
      expect(Math.min(...tops), id).toBeGreaterThanOrEqual(REST_STATIONS[id].y)
    }
  })

  it('keeps the desks drawn in both phases, because they belong to neither', () => {
    expect(doc.querySelectorAll('[data-desk]')).toHaveLength(AGENT_IDS.length)
    for (const desk of doc.querySelectorAll('[data-desk]')) {
      expect(desk.closest('[data-phase]'), 'a desk must not disappear with a phase').toBeNull()
    }
  })

  it('floats the zZz and the steam in pixel steps', () => {
    expect(doc.querySelectorAll('[data-seated] .office-zzz')).toHaveLength(AGENT_IDS.length)
    expect(css).toMatch(/\.office-zzz\s*\{[^}]*steps\(1, end\)/)
  })
})

describe('the story the animation tells', () => {
  const seconds = (name: string) => Number(css.match(new RegExp(`\\.${name}\\s*\\{[^}]*animation(?:-duration)?:[^;]*?([\\d.]+)s`))?.[1])

  it('works first and rests after, in one loop: the work phase and the rest phase share a clock', () => {
    const work = doc.querySelector('[data-phase="work"]')
    const rest = doc.querySelector('[data-phase="rest"]')
    expect(work).not.toBeNull()
    expect(rest).not.toBeNull()
    expect(rest!.contains(doc.querySelector('[data-seated="claude"]'))).toBe(true)
    expect(work!.contains(doc.querySelector('[data-agent="claude"]'))).toBe(true)
    expect(seconds('phase')).toBe(seconds('spot'))
    expect(seconds('office-bar')).toBe(seconds('phase'))
  })

  it('gives each character a turn, then a round of rest, inside the loop', () => {
    expect(seconds('spot')).toBeGreaterThan(AGENT_IDS.length * 3)
  })

  it('shows a calm still frame for prefers-reduced-motion: at work, the first one in the spotlight', () => {
    const reduced = css.match(/@media \(prefers-reduced-motion: reduce\)\s*\{([\s\S]*)\}\s*$/)?.[1] ?? ''
    expect(reduced).toMatch(/animation:\s*none/)
    expect(reduced).toContain('.office-bar')
    expect(reduced).toContain('.phase')
    expect(reduced).toMatch(/\[data-first\]/)
    expect(reduced).toMatch(/\.phase-rest\s*\{[^}]*opacity:\s*0/)
  })
})
