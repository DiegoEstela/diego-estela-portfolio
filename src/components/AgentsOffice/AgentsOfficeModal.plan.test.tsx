import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { act, fireEvent, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import i18n from '@/i18n'
import { FINISHED_PLAN, WORKING_PLAN, planWithTasks } from '@/test/plans'
import type { Plan } from './plans'
import { AgentsOfficeModal } from './AgentsOfficeModal'
import { AGENT_IDS } from './sprites'

const STEP = 3500
const t = (key: string, options?: Record<string, unknown>) => i18n.t(key, options)
const bubbleText = () => document.querySelector('[data-bubble]')?.textContent ?? null
const advance = (ms: number) => act(() => void vi.advanceTimersByTime(ms))
const seated = () => document.querySelectorAll('[data-pose]').length
const board = () => screen.getByRole('button', { name: /^(Pizarra del plan|Plan board)/ })
const toggle = () => screen.getByRole('button', { name: t('agentsOffice.mode.toggle') })

function open(plan: Plan | null) {
  return render(<AgentsOfficeModal open onClose={() => {}} plan={plan} />)
}

beforeEach(async () => {
  await act(() => i18n.changeLanguage('es'))
})
afterEach(() => {
  vi.useRealTimers()
  document.body.style.overflow = ''
})

describe('the mode comes from the plan', () => {
  it('opens with the team resting when the latest plan is finished', () => {
    open(FINISHED_PLAN)
    expect(seated()).toBe(AGENT_IDS.length)
  })

  it('opens with the team at work while a task is pending', () => {
    open(WORKING_PLAN)
    expect(seated()).toBe(0)
  })

  it('opens with the team at work when there are no plans', () => {
    open(null)
    expect(seated()).toBe(0)
  })

  it('says where the state comes from', () => {
    open(FINISHED_PLAN)
    expect(screen.getByText(t('agentsOffice.mode.fromPlan', { state: t('agentsOffice.mode.resting') }))).toBeInTheDocument()
  })
})

describe('the rest toggle', () => {
  it('is pressed while the team rests and not while it works', () => {
    const { unmount } = open(FINISHED_PLAN)
    expect(toggle()).toHaveAttribute('aria-pressed', 'true')
    unmount()
    open(WORKING_PLAN)
    expect(toggle()).toHaveAttribute('aria-pressed', 'false')
  })

  it('lets the visitor put a resting team to work, and back to what the plan says', async () => {
    open(FINISHED_PLAN)
    await userEvent.click(toggle())
    expect(seated()).toBe(0)
    expect(toggle()).toHaveAttribute('aria-pressed', 'false')
    expect(screen.getByText(t('agentsOffice.mode.manual', { state: t('agentsOffice.mode.working') }))).toBeInTheDocument()

    await userEvent.click(toggle())
    expect(seated()).toBe(AGENT_IDS.length)
    expect(screen.getByText(t('agentsOffice.mode.fromPlan', { state: t('agentsOffice.mode.resting') }))).toBeInTheDocument()
  })

  it('lets the visitor send a working team to rest', async () => {
    open(WORKING_PLAN)
    await userEvent.click(toggle())
    expect(seated()).toBe(AGENT_IDS.length)
    expect(screen.getByText(t('agentsOffice.mode.manual', { state: t('agentsOffice.mode.resting') }))).toBeInTheDocument()
  })

  it('is big enough to tap: it is a real button with room around its label', () => {
    open(WORKING_PLAN)
    expect(toggle().className).toMatch(/min-h-11|h-11/)
  })

  it('comes right after the plan board in tab order', async () => {
    open(WORKING_PLAN)
    board().focus()
    await userEvent.tab()
    expect(toggle()).toHaveFocus()
  })
})

describe('the plan board', () => {
  it('carries the real progress in its name', () => {
    open(planWithTasks(2, 3))
    expect(board()).toHaveAccessibleName(t('agentsOffice.plan.boardLabel', { done: 2, total: 3 }))
  })

  it('says there are no plans when there are none', () => {
    open(null)
    expect(board()).toHaveAccessibleName(t('agentsOffice.plan.boardLabelEmpty'))
  })

  it('follows the active language', async () => {
    await act(() => i18n.changeLanguage('en'))
    open(planWithTasks(2, 3))
    expect(board()).toHaveAccessibleName('Plan board: 2 of 3 tasks done')
  })

  it('opens the card of the plan instead of the card of an agent', async () => {
    open(WORKING_PLAN)
    await userEvent.click(board())
    expect(screen.getByRole('heading', { level: 3, name: 'Oficina de agentes v2' })).toBeInTheDocument()
    expect(screen.getByRole('progressbar')).toHaveAttribute('aria-valuenow', '2')
    expect(screen.queryByText(t('agentsOffice.hint'))).not.toBeInTheDocument()
    expect(board()).toHaveAttribute('aria-pressed', 'true')
  })

  it('goes back to an agent card when a character is picked afterwards', async () => {
    open(WORKING_PLAN)
    await userEvent.click(board())
    await userEvent.click(screen.getByRole('button', { name: t('agentsOffice.agents.code-reviewer.name') }))
    expect(screen.queryByRole('progressbar')).not.toBeInTheDocument()
    expect(screen.getByRole('heading', { level: 3, name: t('agentsOffice.agents.code-reviewer.name') })).toBeInTheDocument()
    expect(board()).toHaveAttribute('aria-pressed', 'false')
  })

  it('does not stop the spotlight, because it is not a character', () => {
    vi.useFakeTimers()
    open(WORKING_PLAN)
    fireEvent.click(board())
    const before = bubbleText()
    advance(STEP)
    expect(bubbleText()).not.toBe(before)
  })
})

describe('the speech bubbles at rest', () => {
  it('say what each one does on the sofa, not at the desk', () => {
    vi.useFakeTimers()
    open(FINISHED_PLAN)
    const resting = t('agentsOffice.agents.claude.resting', { returnObjects: true }) as unknown as string[]
    const working = t('agentsOffice.agents.claude.doing', { returnObjects: true }) as unknown as string[]
    expect(resting.length).toBeGreaterThan(0)
    expect(bubbleText()).toBe(resting[0])
    expect(working).not.toContain(bubbleText())
  })

  it('speak the active language', async () => {
    vi.useFakeTimers()
    await act(() => i18n.changeLanguage('en'))
    open(FINISHED_PLAN)
    const english = i18n.getFixedT('en')('agentsOffice.agents.claude.resting', { returnObjects: true }) as unknown as string[]
    expect(bubbleText()).toBe(english[0])
  })
})
