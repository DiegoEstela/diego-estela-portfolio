import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { act, fireEvent, render, screen } from '@testing-library/react'
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
