import { useState } from 'react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { act, render, screen, waitForElementToBeRemoved } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import i18n from '@/i18n'
import { AgentsOfficeModal } from './AgentsOfficeModal'

function Harness({ onClose }: { onClose?: () => void }) {
  const [open, setOpen] = useState(false)
  return (
    <>
      <button onClick={() => setOpen(true)}>abrir</button>
      <AgentsOfficeModal
        open={open}
        onClose={() => {
          onClose?.()
          setOpen(false)
        }}
      />
    </>
  )
}

const title = () => i18n.t('agentsOffice.title')
const closeLabel = () => i18n.t('agentsOffice.close')

async function openModal() {
  await userEvent.click(screen.getByRole('button', { name: 'abrir' }))
  return screen.findByRole('dialog', { name: title() })
}

afterEach(async () => {
  document.body.style.overflow = ''
  await act(() => i18n.changeLanguage('es'))
})

describe('AgentsOfficeModal semantics', () => {
  it('renders nothing while closed', () => {
    render(<AgentsOfficeModal open={false} onClose={() => {}} />)
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
  })

  it('is a modal dialog named by its title', async () => {
    render(<Harness />)
    const dialog = await openModal()
    expect(dialog).toHaveAttribute('aria-modal', 'true')
    expect(screen.getByRole('heading', { name: title(), level: 2 })).toBeInTheDocument()
  })

  it('does not pass its scrolling on to the page behind', async () => {
    render(<Harness />)
    expect(await openModal()).toHaveClass('overscroll-contain')
  })

  it('is drawn on document.body, so no ancestor transform or overflow can clip it', async () => {
    const { container } = render(<Harness />)
    const dialog = await openModal()
    expect(container.contains(dialog)).toBe(false)
    expect(document.body.contains(dialog)).toBe(true)
  })

  it('follows the active language', async () => {
    await act(() => i18n.changeLanguage('en'))
    render(<Harness />)
    expect(await openModal()).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: 'How AI works for me' })).toBeInTheDocument()
  })

  it('shows the office and a hint, so there is something to do right away', async () => {
    render(<Harness />)
    await openModal()
    expect(screen.getAllByRole('button', { pressed: false })).toHaveLength(5)
    expect(screen.getByText(i18n.t('agentsOffice.hint'))).toBeInTheDocument()
  })

  it('opens the card of the character that is tapped', async () => {
    render(<Harness />)
    await openModal()
    await userEvent.click(screen.getByRole('button', { name: i18n.t('agentsOffice.agents.security-auditor.name') }))
    expect(screen.getByRole('heading', { name: i18n.t('agentsOffice.agents.security-auditor.name'), level: 3 })).toBeInTheDocument()
  })
})

describe('AgentsOfficeModal closing', () => {
  it('closes with Escape', async () => {
    const onClose = vi.fn()
    render(<Harness onClose={onClose} />)
    await openModal()
    await userEvent.keyboard('{Escape}')
    expect(onClose).toHaveBeenCalledTimes(1)
    await waitForElementToBeRemoved(() => screen.queryByRole('dialog'))
  })

  it('closes with the close button', async () => {
    const onClose = vi.fn()
    render(<Harness onClose={onClose} />)
    await openModal()
    await userEvent.click(screen.getByRole('button', { name: closeLabel() }))
    expect(onClose).toHaveBeenCalledTimes(1)
  })

  it('closes when the backdrop is clicked, but not when the dialog itself is', async () => {
    const onClose = vi.fn()
    render(<Harness onClose={onClose} />)
    const dialog = await openModal()
    await userEvent.click(dialog)
    expect(onClose).not.toHaveBeenCalled()
    await userEvent.click(screen.getByTestId('agents-office-backdrop'))
    expect(onClose).toHaveBeenCalledTimes(1)
  })
})

describe('AgentsOfficeModal focus', () => {
  it('moves the focus into the dialog on open and gives it back to the trigger on close', async () => {
    render(<Harness />)
    const trigger = screen.getByRole('button', { name: 'abrir' })
    await openModal()
    expect(screen.getByRole('button', { name: closeLabel() })).toHaveFocus()

    await userEvent.keyboard('{Escape}')
    await waitForElementToBeRemoved(() => screen.queryByRole('dialog'))
    expect(trigger).toHaveFocus()
  })

  it('keeps Tab inside the dialog, wrapping from the last element to the first', async () => {
    render(<Harness />)
    const dialog = await openModal()
    const focusables = Array.from(dialog.querySelectorAll<HTMLElement>('button:not([disabled])'))
    const first = focusables[0]
    const last = focusables[focusables.length - 1]

    last.focus()
    await userEvent.tab()
    expect(first).toHaveFocus()

    await userEvent.tab({ shift: true })
    expect(last).toHaveFocus()
  })

  it('never lets the focus escape to the page behind', async () => {
    render(<Harness />)
    const dialog = await openModal()
    for (let i = 0; i < 12; i++) {
      await userEvent.tab()
      expect(dialog.contains(document.activeElement)).toBe(true)
    }
  })
})

describe('AgentsOfficeModal scroll lock', () => {
  it('stops the page behind from scrolling and restores it afterwards', async () => {
    document.body.style.overflow = 'auto'
    render(<Harness />)
    await openModal()
    expect(document.body.style.overflow).toBe('hidden')

    await userEvent.keyboard('{Escape}')
    await waitForElementToBeRemoved(() => screen.queryByRole('dialog'))
    expect(document.body.style.overflow).toBe('auto')
  })
})
