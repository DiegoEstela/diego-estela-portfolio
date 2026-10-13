import { describe, expect, it, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { OfficeScene } from './OfficeScene'
import { BOARD_HIT_BOX, BUBBLE, REST_STATIONS, SCENE_SIZE, SOFA, STATIONS, bubbleAnchor, hitBoxFor, stationsFor, type Box } from './layout'
import type { OfficeMode } from './officeMode'
import { AGENT_IDS, BOARD_BAR_FILL, REST_POSE, boardFilledCells, type AgentId } from './sprites'
import type { Plan } from './planParser'

const agents = AGENT_IDS.map((id) => ({ id, label: `Agente ${id}` }))

function setup(props: Partial<React.ComponentProps<typeof OfficeScene>> = {}) {
  const onSelect = vi.fn()
  const utils = render(
    <OfficeScene agents={agents} description="Una oficina con cinco asistentes" selectedId={null} boardLabel="Pizarra del plan" onSelect={onSelect} {...props} />,
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

  it('offers one button per agent, named after it, and one more for the plan board', () => {
    setup()
    expect(screen.getAllByRole('button')).toHaveLength(AGENT_IDS.length + 1)
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

const MODES: OfficeMode[] = ['working', 'resting']

// A modal on a 360 px phone leaves 328 px for the scene.
const PHONE_UNIT = (360 - 2 * 16) / SCENE_SIZE.width

const overlaps = (a: Box, b: Box) => a.left < b.right && b.left < a.right && a.top < b.bottom && b.top < a.bottom

describe.each(MODES)('station layout (%s)', (mode) => {
  const stations = stationsFor(mode)
  const boxes = AGENT_IDS.map((id) => ({ id, ...hitBoxFor(mode, id) }))

  it('has a station for every agent', () => {
    expect(Object.keys(stations).sort()).toEqual([...AGENT_IDS].sort())
  })

  it('keeps every touch target inside the scene', () => {
    for (const { id, left, right, top, bottom } of boxes) {
      expect(left, `${id} left`).toBeGreaterThanOrEqual(0)
      expect(right, `${id} right`).toBeLessThanOrEqual(SCENE_SIZE.width)
      expect(top, `${id} top`).toBeGreaterThanOrEqual(0)
      expect(bottom, `${id} bottom`).toBeLessThanOrEqual(SCENE_SIZE.height)
    }
  })

  it('never lets two touch targets overlap, so a finger always hits the right character', () => {
    for (const a of boxes) {
      for (const b of boxes) {
        if (a.id >= b.id) continue
        expect(overlaps(a, b), `${a.id} overlaps ${b.id}`).toBe(false)
      }
    }
  })

  it('makes the touch targets at least 44 css px on a 360px phone', () => {
    for (const { id, left, right, top, bottom } of boxes) {
      expect((right - left) * PHONE_UNIT, `${id} width`).toBeGreaterThanOrEqual(44)
      expect((bottom - top) * PHONE_UNIT, `${id} height`).toBeGreaterThanOrEqual(44)
    }
  })

  it('keeps the plan board clear of every character', () => {
    for (const box of boxes) expect(overlaps(BOARD_HIT_BOX, box), `the board overlaps ${box.id}`).toBe(false)
  })
})

describe('plan board layout', () => {
  it('stays inside the scene and is at least 44 css px on a 360px phone', () => {
    const { left, right, top, bottom } = BOARD_HIT_BOX
    expect(left).toBeGreaterThanOrEqual(0)
    expect(right).toBeLessThanOrEqual(SCENE_SIZE.width)
    expect(top).toBeGreaterThanOrEqual(0)
    expect(bottom).toBeLessThanOrEqual(SCENE_SIZE.height)
    expect((right - left) * PHONE_UNIT).toBeGreaterThanOrEqual(44)
    expect((bottom - top) * PHONE_UNIT).toBeGreaterThanOrEqual(44)
  })
})

describe('sofa layout', () => {
  const seat = { left: SOFA.x, right: SOFA.x + SOFA.width, top: SOFA.y + SOFA.seatOffset, bottom: SOFA.y + SOFA.height }
  // The head of a character: columns 3-8 of its sprite, rows 3-8 below the top of the station.
  const head = ({ cx, y }: { cx: number; y: number }) => ({ left: cx - 5 + 2, right: cx - 5 + 8, top: y + 3, bottom: y + 8 })

  it('fits inside the scene', () => {
    expect(SOFA.x).toBeGreaterThanOrEqual(0)
    expect(SOFA.x + SOFA.width).toBeLessThanOrEqual(SCENE_SIZE.width)
    expect(SOFA.y + SOFA.height).toBeLessThanOrEqual(SCENE_SIZE.height)
  })

  it('sits below the desks of the working team, without touching them', () => {
    const lowestDesk = Math.max(...Object.values(STATIONS).map(({ y }) => y + 22))
    expect(SOFA.y).toBeGreaterThan(lowestDesk)
  })

  it('has a seat under every resting character and never covers a head', () => {
    for (const id of AGENT_IDS) {
      const { cx, y } = stationsFor('resting')[id]
      expect(cx - 5, `${id} starts on the sofa`).toBeGreaterThanOrEqual(seat.left)
      expect(cx + 5, `${id} ends on the sofa`).toBeLessThanOrEqual(seat.right)
      expect(overlaps(seat, head({ cx, y })), `the seat covers the head of ${id}`).toBe(false)
    }
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

describe.each(MODES)('speech bubble placement (%s)', (mode) => {
  const stations = stationsFor(mode)
  const ids = Object.keys(stations) as AgentId[]

  const bubbleBox = (id: AgentId) => {
    const { left } = bubbleAnchor(stations[id].cx)
    const bottom = stations[id].bubbleY
    return { left: left - BUBBLE.width / 2, right: left + BUBBLE.width / 2, top: bottom - BUBBLE.height, bottom }
  }
  // The head of a character: columns 3-8 of its sprite, rows 3-8 below the top of the station.
  const headBox = ({ cx, y }: { cx: number; y: number }) => ({ left: cx - 5 + 2, right: cx - 5 + 8, top: y + 3, bottom: y + 8 })

  it.each(ids)('the bubble of %s stays inside the scene', (id) => {
    const box = bubbleBox(id)
    expect(box.top).toBeGreaterThanOrEqual(0)
    expect(box.bottom).toBeLessThanOrEqual(SCENE_SIZE.height)
  })

  it('never covers the head of another character, so everybody stays recognizable while one speaks', () => {
    for (const speaker of ids) {
      for (const other of ids) {
        if (other === speaker) continue
        expect(overlaps(bubbleBox(speaker), headBox(stations[other])), `${speaker}'s bubble covers ${other}'s head`).toBe(false)
      }
    }
  })
})

const plan = (done: number, total: number): Plan => ({
  issue: 24,
  title: 'Plan',
  issueUrl: null,
  tasks: Array.from({ length: total }, (_, index) => ({ title: `Task ${index + 1}`, done: index < done })),
})

/** The top of the character of an agent: the smallest y among its rectangles. */
const characterTop = (container: HTMLElement, id: AgentId) =>
  Math.min(...Array.from(container.querySelectorAll(`[data-agent="${id}"] .office-character rect`)).map((r) => Number(r.getAttribute('y'))))

describe('the team at work', () => {
  it('is the default: everybody at their desk', () => {
    const { container } = setup()
    for (const id of AGENT_IDS) {
      expect(characterTop(container, id)).toBeGreaterThanOrEqual(STATIONS[id].y)
      expect(characterTop(container, id)).toBeLessThan(STATIONS[id].y + 12)
    }
    expect(container.querySelector('[data-pose]')).toBeNull()
  })

  it('draws a desk for every agent', () => {
    const { container } = setup()
    expect(container.querySelectorAll('[data-desk]')).toHaveLength(AGENT_IDS.length)
  })

  it('shows an empty sofa', () => {
    const { container } = setup()
    expect(container.querySelector('[data-sofa="back"]')).not.toBeNull()
    expect(container.querySelector('[data-sofa="seat"]')).not.toBeNull()
  })
})

describe('the team at rest', () => {
  it('sits every agent on the sofa, away from the desk', () => {
    const { container } = setup({ mode: 'resting' })
    for (const id of AGENT_IDS) {
      expect(characterTop(container, id)).toBeGreaterThanOrEqual(REST_STATIONS[id].y)
      expect(characterTop(container, id)).toBeLessThan(REST_STATIONS[id].y + 12)
    }
  })

  it('leaves the desks where they were, now empty', () => {
    const { container } = setup({ mode: 'resting' })
    expect(container.querySelectorAll('[data-desk]')).toHaveLength(AGENT_IDS.length)
    expect(container.querySelectorAll('.office-station')).toHaveLength(AGENT_IDS.length)
  })

  it('gives each agent its pose: asleep or with a coffee', () => {
    const { container } = setup({ mode: 'resting' })
    for (const id of AGENT_IDS) {
      expect(container.querySelector(`[data-agent="${id}"]`)).toHaveAttribute('data-pose', REST_POSE[id])
    }
  })

  it('draws the seat of the sofa in front of the characters, so it hides their legs', () => {
    const { container } = setup({ mode: 'resting' })
    const seat = container.querySelector('[data-sofa="seat"]')!
    const back = container.querySelector('[data-sofa="back"]')!
    const lastCharacter = container.querySelector('[data-agent="security-auditor"].office-station')!
    expect(back.compareDocumentPosition(lastCharacter) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy()
    expect(lastCharacter.compareDocumentPosition(seat) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy()
  })

  it('moves the touch targets to the sofa', () => {
    setup({ mode: 'resting' })
    const button = screen.getByRole('button', { name: 'Agente claude' })
    const left = parseFloat(button.style.left)
    expect(left).toBeCloseTo(((REST_STATIONS.claude.cx - 10) / SCENE_SIZE.width) * 100, 1)
  })

  it('lets the zZz and the steam move on their own, apart from the body that breathes', () => {
    const { container } = setup({ mode: 'resting' })
    for (const id of AGENT_IDS) {
      const station = container.querySelector(`[data-agent="${id}"].office-station`)!
      expect(station.querySelector('.office-resting'), id).not.toBeNull()
      expect(station.querySelector('.office-zzz'), id).not.toBeNull()
    }
  })

  it('does not draw them at work', () => {
    const { container } = setup()
    expect(container.querySelector('.office-zzz')).toBeNull()
    expect(container.querySelector('.office-resting')).toBeNull()
  })

  it('still highlights the one in the spotlight', () => {
    const { container } = setup({ mode: 'resting', activeId: 'security-auditor' })
    const active = Array.from(container.querySelectorAll('.office-station[data-active]')).map((g) => g.getAttribute('data-agent'))
    expect(active).toEqual(['security-auditor'])
  })

  it('puts the speech bubble above the sofa, not above the empty desk', () => {
    setup({ mode: 'resting', bubble: { id: 'claude', text: 'Un café' } })
    const top = parseFloat(screen.getByText('Un café').closest<HTMLElement>('[data-bubble]')!.style.top)
    expect(top).toBeCloseTo((REST_STATIONS.claude.bubbleY / SCENE_SIZE.height) * 100, 1)
  })
})

describe('the plan board', () => {
  it('is a button after the five characters, so the tab order follows the reading order', () => {
    setup({ boardLabel: 'Pizarra del plan' })
    const names = screen.getAllByRole('button').map((b) => b.getAttribute('aria-label'))
    expect(names).toEqual([...AGENT_IDS.map((id) => `Agente ${id}`), 'Pizarra del plan'])
  })

  it('has a name that the caller provides, so it can carry the progress in any language', () => {
    setup({ boardLabel: 'Pizarra del plan: 7 de 13 tareas hechas' })
    expect(screen.getByRole('button', { name: 'Pizarra del plan: 7 de 13 tareas hechas' })).toBeInTheDocument()
  })

  it('selects the board on click', async () => {
    const { onSelect } = setup({ boardLabel: 'Pizarra' })
    await userEvent.click(screen.getByRole('button', { name: 'Pizarra' }))
    expect(onSelect).toHaveBeenCalledWith('board')
  })

  it('is pressed only when it is the selection', () => {
    setup({ selectedId: 'board', boardLabel: 'Pizarra' })
    expect(screen.getByRole('button', { name: 'Pizarra' })).toHaveAttribute('aria-pressed', 'true')
    expect(screen.getByRole('button', { name: 'Agente claude' })).toHaveAttribute('aria-pressed', 'false')
  })

  it('sits in the touch box reserved for it', () => {
    setup({ boardLabel: 'Pizarra' })
    const button = screen.getByRole('button', { name: 'Pizarra' })
    expect(parseFloat(button.style.left)).toBeCloseTo((BOARD_HIT_BOX.left / SCENE_SIZE.width) * 100, 1)
    expect(parseFloat(button.style.top)).toBeCloseTo((BOARD_HIT_BOX.top / SCENE_SIZE.height) * 100, 1)
  })

  const filledWidth = (container: HTMLElement) =>
    Array.from(container.querySelectorAll('[data-board] rect'))
      .filter((r) => r.getAttribute('fill') === BOARD_BAR_FILL)
      .reduce((sum, r) => sum + Number(r.getAttribute('width')), 0)

  it.each([
    [0, 13],
    [7, 13],
    [12, 13],
    [13, 13],
  ])('draws the progress of the plan: %i of %i tasks', (done, total) => {
    const { container } = setup({ plan: plan(done, total) })
    expect(filledWidth(container)).toBe(boardFilledCells(done, total))
  })

  it('draws an empty bar when there is no plan', () => {
    const { container } = setup({ plan: null })
    expect(container.querySelector('[data-board]')).not.toBeNull()
    expect(filledWidth(container)).toBe(0)
  })
})
