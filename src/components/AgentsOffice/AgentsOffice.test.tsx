import { afterEach, describe, expect, it } from 'vitest'
import { act, render, screen, waitForElementToBeRemoved } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import i18n from '@/i18n'
import { AgentsOffice } from './AgentsOffice'

const cta = () => i18n.t('agentsOffice.cta')

afterEach(async () => {
  document.body.style.overflow = ''
  await act(() => i18n.changeLanguage('es'))
})

describe('AgentsOffice button', () => {
  it('invites the visitor with a question, in Spanish', async () => {
    await act(() => i18n.changeLanguage('es'))
    render(<AgentsOffice />)
    expect(screen.getByRole('button', { name: '¿Cómo trabaja la IA por mí?' })).toBeInTheDocument()
  })

  it('and in English', async () => {
    await act(() => i18n.changeLanguage('en'))
    render(<AgentsOffice />)
    expect(screen.getByRole('button', { name: 'How does AI work for me?' })).toBeInTheDocument()
  })

  it('announces that it opens a dialog', () => {
    render(<AgentsOffice />)
    expect(screen.getByRole('button', { name: cta() })).toHaveAttribute('aria-haspopup', 'dialog')
  })

  it('does not show the office until the button is pressed', () => {
    render(<AgentsOffice />)
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
  })

  it('opens the office when pressed', async () => {
    render(<AgentsOffice />)
    await userEvent.click(screen.getByRole('button', { name: cta() }))
    // The first open downloads and transforms the lazy chunk, which takes longer than the 1s default.
    expect(await screen.findByRole('dialog', { name: i18n.t('agentsOffice.title') }, { timeout: 8000 })).toBeInTheDocument()
  })

  it('closes, and can be opened again', async () => {
    render(<AgentsOffice />)
    const button = screen.getByRole('button', { name: cta() })
    await userEvent.click(button)
    await screen.findByRole('dialog', {}, { timeout: 8000 })
    await userEvent.keyboard('{Escape}')
    await waitForElementToBeRemoved(() => screen.queryByRole('dialog'))
    expect(button).toHaveFocus()

    await userEvent.click(button)
    expect(await screen.findByRole('dialog')).toBeInTheDocument()
  })
})
