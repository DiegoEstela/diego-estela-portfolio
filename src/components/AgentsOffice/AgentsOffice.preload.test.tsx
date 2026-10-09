import { beforeEach, describe, expect, it, vi } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'

// The factory runs each time the module is imported, which counts real loads.
const loads = vi.hoisted(() => ({ count: 0 }))

// Every case needs a fresh module graph and a fresh mock, otherwise the chunk is already loaded
// from the previous case. vi.mock would keep its first result across resetModules; doMock does not.
async function renderFresh() {
  vi.resetModules()
  loads.count = 0
  vi.doMock('./AgentsOfficeModal', () => {
    loads.count++
    return { AgentsOfficeModal: ({ open }: { open: boolean }) => (open ? <div role="dialog" aria-label="fake" /> : null) }
  })
  const { AgentsOffice } = await import('./AgentsOffice')
  render(<AgentsOffice />)
  return screen.getByRole('button')
}

beforeEach(() => {
  loads.count = 0
})

describe('AgentsOffice lazy loading', () => {
  it('does not load the office code just by showing the button', async () => {
    await renderFresh()
    expect(loads.count).toBe(0)
  })

  it.each([
    ['hovers', (button: HTMLElement) => userEvent.hover(button)],
    ['focuses', () => userEvent.tab()],
    ['touches', (button: HTMLElement) => userEvent.pointer({ keys: '[TouchA>]', target: button })],
  ])('starts loading the office when the visitor %s the button, before any click', async (_name, interact) => {
    const button = await renderFresh()
    await interact(button)
    await waitFor(() => expect(loads.count).toBeGreaterThanOrEqual(1))
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
  })
})
