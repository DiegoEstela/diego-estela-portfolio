import { describe, expect, it, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { OfficeScene } from './OfficeScene'
import { BUBBLE, HIT, SCENE_SIZE, STATIONS, bubbleAnchor } from './layout'
import { AGENT_IDS } from './sprites'

const agents = AGENT_IDS.map((id) => ({ id, label: `Agente ${id}` }))

function setup(props: Partial<React.ComponentProps<typeof OfficeScene>> = {}) {
  const onSelect = vi.fn()
  const utils = render(
    <OfficeScene agents={agents} description="Una oficina con cinco asistentes" selectedId={null} onSelect={onSelect} {...props} />,
  )
  return { onSelect, ...utils }
}

describe('OfficeScene', () => {
  it('describes the picture for screen readers', () => {
    setup()
    expect(screen.getByRole('img', { name: 'Una oficina con cinco asistentes' })).toBeInTheDocument()
  })

  it('draws real pixel art, not an empty svg', () => {
    const { container } = setup()
    expect(container.querySelectorAll('svg rect').length).toBeGreaterThan(100)
  })

  it('offers one button per agent, named after it', () => {
    setup()
    const buttons = screen.getAllByRole('button')
    expect(buttons).toHaveLength(5)
    for (const { label } of agents) expect(screen.getByRole('button', { name: label })).toBeInTheDocument()
  })

  it('selects an agent on click', async () => {
    const { onSelect } = setup()
    await userEvent.click(screen.getByRole('button', { name: 'Agente security-auditor' }))
    expect(onSelect).toHaveBeenCalledExactlyOnceWith('security-auditor')
  })

  it.each(['{Enter}', ' '])('selects an agent from the keyboard with %j', async (key) => {
    const { onSelect } = setup()
    await userEvent.tab()
    await userEvent.keyboard(key)
    expect(onSelect).toHaveBeenCalledExactlyOnceWith('claude')
  })

  it('follows the reading order when tabbing through the characters', async () => {
    setup()
    const order: string[] = []
    for (let i = 0; i < 5; i++) {
      await userEvent.tab()
      order.push(document.activeElement?.getAttribute('data-agent') ?? '')
    }
    expect(order).toEqual([...AGENT_IDS])
  })

  it('marks only the selected agent as pressed', () => {
    setup({ selectedId: 'code-reviewer' })
    const pressed = screen.getAllByRole('button').filter((b) => b.getAttribute('aria-pressed') === 'true')
    expect(pressed.map((b) => b.getAttribute('data-agent'))).toEqual(['code-reviewer'])
  })
})

describe('station layout', () => {
  const HIT_WIDTH = HIT.width
  const HIT_HEIGHT = HIT.height

  it('has a station for every agent', () => {
    expect(Object.keys(STATIONS).sort()).toEqual([...AGENT_IDS].sort())
  })

  it('keeps every touch target inside the scene', () => {
    for (const [id, { cx, y }] of Object.entries(STATIONS)) {
      expect(cx - HIT_WIDTH / 2, `${id} left`).toBeGreaterThanOrEqual(0)
      expect(cx + HIT_WIDTH / 2, `${id} right`).toBeLessThanOrEqual(SCENE_SIZE.width)
      expect(y, `${id} top`).toBeGreaterThanOrEqual(0)
      expect(y + HIT_HEIGHT, `${id} bottom`).toBeLessThanOrEqual(SCENE_SIZE.height)
    }
  })

  it('never lets two touch targets overlap, so a finger always hits the right character', () => {
    const boxes = Object.entries(STATIONS).map(([id, { cx, y }]) => ({ id, left: cx - HIT_WIDTH / 2, top: y, right: cx + HIT_WIDTH / 2, bottom: y + HIT_HEIGHT }))
    for (const a of boxes) {
      for (const b of boxes) {
        if (a.id >= b.id) continue
        const overlaps = a.left < b.right && b.left < a.right && a.top < b.bottom && b.top < a.bottom
        expect(overlaps, `${a.id} overlaps ${b.id}`).toBe(false)
      }
    }
  })

  it('makes the touch targets at least 44 css px wide on a 360px phone', () => {
    const phoneSceneWidth = 360 - 2 * 16 // modal gutter
    const unit = phoneSceneWidth / SCENE_SIZE.width
    expect(HIT_WIDTH * unit).toBeGreaterThanOrEqual(44)
    expect(HIT_HEIGHT * unit).toBeGreaterThanOrEqual(44)
  })
})

describe('speech bubble', () => {
  it('shows what the active character is doing, above that character', () => {
    setup({ activeId: 'code-reviewer', bubble: { id: 'code-reviewer', text: 'Revisando el diff contra main' } })
    const bubble = screen.getByText('Revisando el diff contra main')
    expect(bubble).toBeInTheDocument()
    const left = parseFloat(bubble.closest('[data-bubble]')!.getAttribute('style')!.match(/left:\s*([\d.]+)%/)![1])
    expect(left).toBeCloseTo((bubbleAnchor(STATIONS['code-reviewer'].cx).left / SCENE_SIZE.width) * 100, 1)
  })

  it('is decorative: the same information is in the card, so it is hidden from screen readers', () => {
    setup({ bubble: { id: 'claude', text: 'Escribiendo el plan' } })
    expect(screen.getByText('Escribiendo el plan').closest('[data-bubble]')).toHaveAttribute('aria-hidden', 'true')
  })

  it('is not drawn without a bubble', () => {
    const { container } = setup({ bubble: null })
    expect(container.querySelector('[data-bubble]')).toBeNull()
  })

  it('never lets the bubble stick out of the scene, even for the characters at the edges', () => {
    for (const [id, { cx }] of Object.entries(STATIONS)) {
      const { left, tail } = bubbleAnchor(cx)
      expect(left - BUBBLE.width / 2, `${id} left edge`).toBeGreaterThanOrEqual(0)
      expect(left + BUBBLE.width / 2, `${id} right edge`).toBeLessThanOrEqual(SCENE_SIZE.width)
      expect(left + tail, `${id} tail points at the character`).toBeCloseTo(cx)
      expect(Math.abs(tail), `${id} tail stays on the bubble`).toBeLessThan(BUBBLE.width / 2)
    }
  })
})

describe('spotlight and idle animation', () => {
  it('highlights only the active station', () => {
    const { container } = setup({ activeId: 'web-quality-auditor' })
    const active = Array.from(container.querySelectorAll('.office-station[data-active]')).map((g) => g.getAttribute('data-agent'))
    expect(active).toEqual(['web-quality-auditor'])
  })

  it('highlights nobody without a spotlight', () => {
    const { container } = setup({ activeId: null })
    expect(container.querySelectorAll('.office-station[data-active]')).toHaveLength(0)
  })

  it('starts each character at a different moment, so they do not move in unison', () => {
    const { container } = setup()
    const delays = Array.from(container.querySelectorAll<SVGGElement>('.office-character')).map((g) => g.style.animationDelay)
    expect(delays).toHaveLength(5)
    expect(new Set(delays).size).toBe(5)
  })
})
