import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { act, fireEvent, render, screen, waitForElementToBeRemoved } from '@testing-library/react'
import i18n from '@/i18n'
import { AgentsOfficeModal } from './AgentsOfficeModal'

// A visitor who asked the system for less motion must get a calm, still scene.
vi.mock('framer-motion', async (importOriginal) => ({
  ...(await importOriginal<typeof import('framer-motion')>()),
  useReducedMotion: () => true,
}))

const bubbleText = () => document.querySelector('[data-bubble]')?.textContent ?? null

beforeEach(async () => {
  vi.useFakeTimers()
  await act(() => i18n.changeLanguage('es'))
})
afterEach(() => {
  vi.useRealTimers()
  document.body.style.overflow = ''
})

describe('AgentsOfficeModal with reduced motion', () => {
  it('shows no rotating bubble and starts no timer', () => {
    render(<AgentsOfficeModal open onClose={() => {}} />)
    expect(bubbleText()).toBeNull()
    act(() => void vi.advanceTimersByTime(3500 * 5))
    expect(bubbleText()).toBeNull()
  })

  it('still lets the visitor pick a character and read its bubble and card', () => {
    render(<AgentsOfficeModal open onClose={() => {}} />)
    fireEvent.click(screen.getByRole('button', { name: i18n.t('agentsOffice.agents.code-reviewer.name') }))
    expect(bubbleText()).not.toBeNull()
    expect(screen.getByRole('heading', { level: 3, name: i18n.t('agentsOffice.agents.code-reviewer.name') })).toBeInTheDocument()
  })
})

describe('AgentsOfficeModal scrolling with reduced motion', () => {
  it('jumps to the card instead of animating the scroll', () => {
    vi.mocked(Element.prototype.scrollIntoView).mockClear()
    render(<AgentsOfficeModal open onClose={() => {}} />)
    fireEvent.click(screen.getByRole('button', { name: i18n.t('agentsOffice.agents.claude.name') }))
    expect(Element.prototype.scrollIntoView).toHaveBeenCalledWith({ block: 'nearest', behavior: 'auto' })
  })
})

describe('AgentsOfficeModal reopening', () => {
  it('starts from scratch: the selection of the last visit is gone', async () => {
    vi.useRealTimers() // with reduced motion the closing animation is instant, so real time is enough
    const { rerender } = render(<AgentsOfficeModal open onClose={() => {}} />)
    fireEvent.click(screen.getByRole('button', { name: i18n.t('agentsOffice.agents.security-auditor.name') }))
    expect(screen.getAllByRole('button', { pressed: true })).toHaveLength(1)

    rerender(<AgentsOfficeModal open={false} onClose={() => {}} />)
    await waitForElementToBeRemoved(() => screen.queryByRole('dialog'))

    rerender(<AgentsOfficeModal open onClose={() => {}} />)
    expect(screen.queryAllByRole('button', { pressed: true })).toHaveLength(0)
    expect(screen.getByText(i18n.t('agentsOffice.hint'))).toBeInTheDocument()
  })
})
