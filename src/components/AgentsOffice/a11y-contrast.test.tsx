/// <reference types="node" />
import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'
import { render, screen } from '@testing-library/react'
import i18n from '@/i18n'
import { AgentCard } from './AgentCard'
import { OfficeScene } from './OfficeScene'
import { FOCUS_RING, WALL_COLOR } from './layout'
import { AGENT_IDS, DECOR, boardSprite, sofaSprites } from './sprites'
import { PlanCard } from './PlanCard'
import { planWithTasks } from '@/test/plans'

const css = readFileSync('src/styles/globals.css', 'utf8')

/** The hex custom properties of one theme, read from the real stylesheet. */
function themeVars(selector: ':root' | '.light') {
  const escaped = selector.replace('.', '\\.')
  const block = css.match(new RegExp(`(?:^|\\n)\\s*${escaped}\\s*\\{([^}]*)\\}`))?.[1] ?? ''
  return Object.fromEntries([...block.matchAll(/(--[\w-]+):\s*(#[0-9a-fA-F]{6})\s*;/g)].map((m) => [m[1], m[2]]))
}
const THEMES = [
  ['dark', themeVars(':root')],
  ['light', themeVars('.light')],
] as const

const channel = (value: number) => {
  const c = value / 255
  return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4
}
const rgb = (hex: string) => [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16))
const luminance = (hex: string) => {
  const [r, g, b] = rgb(hex).map(channel)
  return 0.2126 * r + 0.7152 * g + 0.0722 * b
}
const contrast = (a: string, b: string) => {
  const [hi, lo] = [luminance(a), luminance(b)].sort((x, y) => y - x)
  return (hi + 0.05) / (lo + 0.05)
}
/** jsdom may report a color as #rrggbb or as rgb(r, g, b): compare them in one format. */
const toHex = (color: string) =>
  color.startsWith('#')
    ? color.toUpperCase()
    : '#' +
      (color.match(/\d+/g) ?? [])
        .slice(0, 3)
        .map((n) => Number(n).toString(16).padStart(2, '0'))
        .join('')
        .toUpperCase()

describe('the stylesheet exposes both themes', () => {
  it.each(THEMES)('%s theme has the colors these tests rely on', (_name, vars) => {
    expect(vars['--bg-primary']).toBeDefined()
    expect(vars['--accent']).toBeDefined()
  })
})

describe('"Orchestrator" badge', () => {
  it('uses the page background color for its text, because white on the accent fails in the dark theme', () => {
    render(<AgentCard selectedId="claude" agents={[]} />)
    const badge = screen.getByText(i18n.t('agentsOffice.orchestrator'))
    expect(badge.style.color).toBe('var(--bg-primary)')
    expect(badge.style.background).toContain('var(--accent)')
  })

  it.each(THEMES)('reads at 4.5:1 or better in the %s theme', (_name, vars) => {
    expect(contrast(vars['--bg-primary'], vars['--accent'])).toBeGreaterThanOrEqual(4.5)
  })
})

describe('hero button', () => {
  const block = css.match(/\.agents-cta\s*\{([^}]*)\}/)?.[1] ?? ''
  const text = block.match(/\scolor:\s*(#[0-9a-fA-F]{6})/)?.[1] ?? ''
  const gold = [...(block.match(/background:[^;]*;/)?.[0] ?? '').matchAll(/#[0-9a-fA-F]{6}/g)].map((m) => m[0])

  it('is gold, defined in the stylesheet', () => {
    expect(text).not.toBe('')
    expect(gold.length).toBeGreaterThanOrEqual(2)
  })

  it('keeps its text at 4.5:1 or better over every stop of the gold, in any theme', () => {
    for (const stop of gold) expect(contrast(text, stop)).toBeGreaterThanOrEqual(4.5)
  })
})

describe('focus and selection ring of the characters', () => {
  const sceneBackgrounds = {
    wall: WALL_COLOR,
    'floor tile a': DECOR.floorTile.palette.a,
    'floor tile b': DECOR.floorTile.palette.b,
  }

  function renderScene() {
    const agents = AGENT_IDS.map((id) => ({ id, label: id }))
    render(<OfficeScene agents={agents} description="x" selectedId="claude" boardLabel="Pizarra" onSelect={() => {}} />)
    return screen.getAllByRole('button')
  }

  it('uses a fixed color, because the scene stays dark in both themes', () => {
    for (const button of renderScene()) {
      expect(toHex(button.style.outlineColor)).toBe(FOCUS_RING.toUpperCase())
    }
  })

  it('marks the selected character with the same color', () => {
    const selected = renderScene().find((b) => b.getAttribute('aria-pressed') === 'true')!
    const [r, g, b] = rgb(FOCUS_RING)
    const shadow = selected.style.boxShadow.toUpperCase()
    // cssstyle may rewrite #hex as rgb(): accept either spelling of the same color
    expect(shadow.includes(FOCUS_RING.toUpperCase()) || shadow.includes(`RGB(${r}, ${g}, ${b})`)).toBe(true)
  })

  it.each(Object.entries(sceneBackgrounds))('stands out against the %s by at least 3:1', (_name, background) => {
    expect(contrast(FOCUS_RING, background)).toBeGreaterThanOrEqual(3)
  })
})

describe('plan card', () => {
  it.each(THEMES)('keeps every kind of text at 4.5:1 or better over the card (%s theme)', (_name, vars) => {
    const card = vars['--bg-card']
    expect(card).toBeDefined()
    expect(contrast(vars['--text-primary'], card), 'text').toBeGreaterThanOrEqual(4.5)
    expect(contrast(vars['--text-secondary'], card), 'secondary text').toBeGreaterThanOrEqual(4.5)
    expect(contrast(vars['--accent'], card), 'labels and link').toBeGreaterThanOrEqual(4.5)
  })

  it('takes every one of those colors from the theme, so both themes are covered', () => {
    render(<PlanCard plan={planWithTasks(1, 2)} />)
    const html = document.body.innerHTML
    expect(html).toContain('var(--text-primary)')
    expect(html).toContain('var(--text-secondary)')
    expect(html).toContain('var(--accent)')
    expect(html).toContain('var(--bg-card)')
    expect(html).not.toMatch(/#[0-9a-fA-F]{6}/)
  })

  it.each(THEMES)('draws the progress bar at 3:1 or better against its track and its card (%s theme)', (_name, vars) => {
    expect(contrast(vars['--accent'], vars['--bg-primary']), 'fill over track').toBeGreaterThanOrEqual(3)
    expect(contrast(vars['--accent'], vars['--bg-card']), 'fill over card').toBeGreaterThanOrEqual(3)
  })
})

describe('rest toggle', () => {
  it.each(THEMES)('reads at 4.5:1 or better both pressed and not (%s theme)', (_name, vars) => {
    expect(contrast(vars['--bg-primary'], vars['--accent']), 'pressed').toBeGreaterThanOrEqual(4.5)
    expect(contrast(vars['--text-primary'], vars['--bg-card']), 'not pressed').toBeGreaterThanOrEqual(4.5)
  })
})

describe('board of the wall', () => {
  const { palette } = boardSprite(7, 13)

  it('shows the filled part of the bar at 3:1 or better against the rest of the bar and the panel', () => {
    expect(contrast(palette.f, palette.t), 'fill over track').toBeGreaterThanOrEqual(3)
    expect(contrast(palette.f, palette.p), 'fill over panel').toBeGreaterThanOrEqual(3)
  })

  it('stands out from the wall it hangs on', () => {
    expect(contrast(palette.p, WALL_COLOR)).toBeGreaterThanOrEqual(3)
  })

  it('is marked with the same ring as the characters when it is selected', () => {
    render(<OfficeScene agents={AGENT_IDS.map((id) => ({ id, label: id }))} description="x" selectedId="board" boardLabel="Pizarra" onSelect={() => {}} />)
    const board = screen.getByRole('button', { name: 'Pizarra' })
    expect(toHex(board.style.outlineColor)).toBe(FOCUS_RING.toUpperCase())
    const [r, g, b] = rgb(FOCUS_RING)
    const shadow = board.style.boxShadow.toUpperCase()
    expect(shadow.includes(FOCUS_RING.toUpperCase()) || shadow.includes(`RGB(${r}, ${g}, ${b})`)).toBe(true)
  })
})

describe('focus ring over the sofa', () => {
  const { back, seat } = sofaSprites(100)
  const colors = Object.entries({ ...back.palette, ...seat.palette })

  it.each(colors)('stands out against the sofa color %s by at least 3:1', (_letter, color) => {
    expect(contrast(FOCUS_RING, color)).toBeGreaterThanOrEqual(3)
  })

  it('uses the same ring for a character that sits on the sofa', () => {
    render(<OfficeScene agents={AGENT_IDS.map((id) => ({ id, label: id }))} description="x" selectedId="claude" mode="resting" boardLabel="Pizarra" onSelect={() => {}} />)
    const selected = screen.getAllByRole('button').find((b) => b.getAttribute('aria-pressed') === 'true')!
    expect(toHex(selected.style.outlineColor)).toBe(FOCUS_RING.toUpperCase())
  })
})
