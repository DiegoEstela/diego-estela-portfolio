/// <reference types="node" />
import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'
import { render, screen } from '@testing-library/react'
import i18n from '@/i18n'
import { AgentCard } from './AgentCard'
import { OfficeScene } from './OfficeScene'
import { FOCUS_RING, WALL_COLOR } from './layout'
import { AGENT_IDS, DECOR } from './sprites'

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
/** `foreground` laid over `background` at the given opacity (0-1), as a hex color. */
const blend = (foreground: string, background: string, opacity: number) =>
  '#' +
  rgb(foreground)
    .map((f, i) => Math.round(f * opacity + rgb(background)[i] * (1 - opacity)).toString(16).padStart(2, '0'))
    .join('')
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
  const alpha = Number(css.match(/\.agents-cta\s*\{[^}]*?background:[^;]*color-mix\(in srgb,\s*var\(--accent\)\s*(\d+)%/)?.[1]) / 100

  it('tints its background with a light mix of the accent, defined in the stylesheet', () => {
    expect(alpha).toBeGreaterThan(0)
    expect(alpha).toBeLessThan(0.3)
  })

  it.each(THEMES)('keeps its accent text at 4.5:1 or better over the most tinted point (%s theme)', (_name, vars) => {
    const worstBackground = blend(vars['--accent'], vars['--bg-primary'], alpha)
    expect(contrast(vars['--accent'], worstBackground)).toBeGreaterThanOrEqual(4.5)
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
    render(<OfficeScene agents={agents} description="x" selectedId="claude" onSelect={() => {}} />)
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
