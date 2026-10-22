import { describe, expect, it } from 'vitest'
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
})
