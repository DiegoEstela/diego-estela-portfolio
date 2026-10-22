import { describe, expect, it, vi } from 'vitest'
import { render, screen, waitFor, waitForElementToBeRemoved } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { BOOT_MS, WorldBoot } from './WorldBoot'

const boot = () => screen.queryByTestId('world-boot')

describe('WorldBoot', () => {
  it('covers the world with the machine, hidden from assistive technology', () => {
    render(<WorldBoot skip={false} />)
    expect(boot()).toHaveAttribute('aria-hidden', 'true')
  })

  it('goes away by itself once the machine has run', async () => {
    render(<WorldBoot skip={false} />)
    await waitFor(() => expect(boot()).not.toBeInTheDocument(), { timeout: BOOT_MS + 3000 })
  })

  it('goes away when tapped, for a visitor in a hurry', async () => {
    render(<WorldBoot skip={false} />)
    await userEvent.click(boot()!)
    await waitForElementToBeRemoved(boot, { timeout: 3000 })
  })

  it('does not show at all with reduced motion', () => {
    render(<WorldBoot skip />)
    expect(boot()).not.toBeInTheDocument()
  })

  it('runs one timer, however many times the world around it re-renders', () => {
    const spy = vi.spyOn(globalThis, 'setTimeout')
    const { rerender } = render(<WorldBoot skip={false} />)
    rerender(<WorldBoot skip={false} />)
    rerender(<WorldBoot skip={false} />)
    const bootTimers = spy.mock.calls.filter(([, delay]) => delay === BOOT_MS)
    spy.mockRestore()
    expect(bootTimers).toHaveLength(1)
  })

  it('is skipped with any key, for a visitor with a keyboard', async () => {
    render(<WorldBoot skip={false} />)
    await userEvent.keyboard('a')
    await waitForElementToBeRemoved(boot, { timeout: 3000 })
  })

  it('leaves Escape to the dialog, which closes the world', async () => {
    const dialogHandler = vi.fn()
    document.addEventListener('keydown', dialogHandler)
    render(<WorldBoot skip={false} />)
    await userEvent.keyboard('{Escape}')
    document.removeEventListener('keydown', dialogHandler)

    expect(dialogHandler).toHaveBeenCalledTimes(1)
    expect(boot()).toBeInTheDocument()
  })
})
