import { describe, expect, it } from 'vitest'
import en from '../../locales/en.json'
import { SCENE_SIZE } from './layout'
import { renderOfficeSvg } from './officeSvg'
import { AGENT_IDS, characterLayers, spriteToRects, type AgentId } from './sprites'

const agents = Object.fromEntries(
  AGENT_IDS.map((id) => [id, { doing: en.agentsOffice.agents[id].doing[0] }]),
) as Record<AgentId, { doing: string }>

const input = { title: en.agentsOffice.sceneDescription, agents }
const svg = renderOfficeSvg(input)
const doc = new DOMParser().parseFromString(svg, 'image/svg+xml')

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
    const css = doc.querySelector('style')?.textContent ?? ''
    expect(css).toMatch(/@keyframes office-bob/)
    expect(css).toMatch(/steps\(1, end\)/)

    const delays = AGENT_IDS.map((id) => {
      const spot = doc.querySelector(`[data-agent="${id}"] [data-spot]`)
      return Number.parseFloat(spot?.getAttribute('style')?.match(/animation-delay:\s*([\d.]+)s/)?.[1] ?? 'NaN')
    })
    expect(delays).toEqual([...delays].sort((a, b) => a - b))
    expect(new Set(delays).size).toBe(AGENT_IDS.length)
  })

  it('respects prefers-reduced-motion by showing a still frame', () => {
    const css = doc.querySelector('style')?.textContent ?? ''
    const reduced = css.match(/@media \(prefers-reduced-motion: reduce\)\s*\{([\s\S]*)\}\s*$/)?.[1] ?? ''
    expect(reduced).toMatch(/animation:\s*none/)
    expect(reduced).toMatch(/\[data-first\]/)
  })

  it('is deterministic', () => {
    expect(renderOfficeSvg(input)).toBe(svg)
  })
})
