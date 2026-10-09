import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { act, fireEvent, render, screen } from '@testing-library/react'
import i18n from '@/i18n'
import { AgentsOfficeModal } from './AgentsOfficeModal'

const STEP = 3500
const activities = (id: string) => i18n.t(`agentsOffice.agents.${id}.doing`, { returnObjects: true }) as string[]
const bubbleText = () => document.querySelector('[data-bubble]')?.textContent ?? null
const advance = (ms: number) => act(() => void vi.advanceTimersByTime(ms))

beforeEach(async () => {
  vi.useFakeTimers()
  await act(() => i18n.changeLanguage('es'))
})
afterEach(() => {
  vi.useRealTimers()
  document.body.style.overflow = ''
})

describe('AgentsOfficeModal spotlight', () => {
  it('opens with the first character already doing something', () => {
    render(<AgentsOfficeModal open onClose={() => {}} />)
    expect(bubbleText()).toBe(activities('claude')[0])
  })

  it('passes the bubble from character to character', () => {
    render(<AgentsOfficeModal open onClose={() => {}} />)
    advance(STEP)
    expect(bubbleText()).toBe(activities('code-reviewer')[0])
    advance(STEP)
    expect(bubbleText()).toBe(activities('content-copywriter')[0])
  })

  it('shows a different activity on every lap', () => {
    render(<AgentsOfficeModal open onClose={() => {}} />)
    advance(STEP * 5)
    expect(bubbleText()).toBe(activities('claude')[1])
  })

  it('highlights the character that has the bubble', () => {
    render(<AgentsOfficeModal open onClose={() => {}} />)
    advance(STEP)
    expect(document.querySelector('.office-station[data-active]')?.getAttribute('data-agent')).toBe('code-reviewer')
  })

  it('keeps the bubble on the character the visitor picked and stops rotating', () => {
    render(<AgentsOfficeModal open onClose={() => {}} />)
    fireEvent.click(screen.getByRole('button', { name: i18n.t('agentsOffice.agents.security-auditor.name') }))
    const picked = bubbleText()
    expect(picked).toBe(activities('security-auditor')[0])
    advance(STEP * 10)
    expect(bubbleText()).toBe(picked)
  })

  it('does not run while the modal is closed', () => {
    render(<AgentsOfficeModal open={false} onClose={() => {}} />)
    expect(bubbleText()).toBeNull()
    advance(STEP * 3)
    expect(bubbleText()).toBeNull()
  })

  it('speaks the active language', async () => {
    await act(() => i18n.changeLanguage('en'))
    render(<AgentsOfficeModal open onClose={() => {}} />)
    const english = i18n.getFixedT('en')('agentsOffice.agents.claude.doing', { returnObjects: true }) as unknown as string[]
    expect(bubbleText()).toBe(english[0])
  })
})
