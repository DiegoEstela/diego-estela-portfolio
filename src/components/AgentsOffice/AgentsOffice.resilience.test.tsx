import { afterEach, describe, expect, it, vi } from 'vitest'
import { fireEvent, render, screen, waitFor, waitForElementToBeRemoved } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import i18n from '@/i18n'

const fakeModal = {
  AgentsOfficeModal: ({ open }: { open: boolean }) => (open ? <div role="dialog" aria-label="fake" /> : null),
}

/** Every case gets its own module graph, so each can mock the lazy chunk differently. */
type Factory = () => Promise<Record<string, unknown>> | Record<string, unknown>

async function renderWith(factory: Factory) {
  vi.resetModules()
  vi.doMock('./AgentsOfficeModal', factory)
  const { AgentsOffice } = await import('./AgentsOffice')
  render(
    <>
      <p>resto de la página</p>
      <AgentsOffice />
    </>,
  )
  return screen.getByRole('button', { name: i18n.t('agentsOffice.cta') })
}

afterEach(() => {
  document.body.style.overflow = ''
  vi.doUnmock('./AgentsOfficeModal')
})

describe('when the chunk fails to load (offline, or a new deploy changed its hash)', () => {
  // The chunk arrives broken: reading its export throws inside React.lazy, the same path a failed
  // download takes. fireEvent clicks without a hover first, so lazy is the only importer.
  const failing = () => ({
    get AgentsOfficeModal(): never {
      throw new Error('ChunkLoadError')
    },
  })
  const failingImport = async () => {
    throw new Error('ChunkLoadError')
  }

  it('keeps the page alive and tells the visitor, instead of crashing the whole app', async () => {
    const button = await renderWith(failing)
    fireEvent.click(button)

    expect(await screen.findByRole('alert')).toHaveTextContent(i18n.t('agentsOffice.loadError'))
    expect(screen.getByText('resto de la página')).toBeInTheDocument()
    expect(button).toBeInTheDocument()
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
  })

  it('does not leave an unhandled rejection when the background preload fails', async () => {
    const button = await renderWith(failingImport)
    await userEvent.hover(button)
    await new Promise((resolve) => setTimeout(resolve, 50))
    expect(screen.getByText('resto de la página')).toBeInTheDocument()
    expect(screen.queryByRole('alert')).not.toBeInTheDocument()
  })

  it('tries again on the next click, and works once the connection is back', async () => {
    let attempts = 0
    const flaky = () => ({
      get AgentsOfficeModal() {
        attempts++
        if (attempts === 1) throw new Error('ChunkLoadError')
        return fakeModal.AgentsOfficeModal
      },
    })
    const button = await renderWith(flaky)

    fireEvent.click(button)
    await screen.findByRole('alert')

    fireEvent.click(button)
    expect(await screen.findByRole('dialog', { name: 'fake' })).toBeInTheDocument()
    expect(screen.queryByRole('alert')).not.toBeInTheDocument()
  })
})

describe('while the chunk is downloading', () => {
  it('answers the click right away with a loading indicator, which goes away once it opens', async () => {
    let release!: () => void
    const gate = new Promise<void>((resolve) => (release = resolve))
    const button = await renderWith(async () => {
      await gate
      return fakeModal
    })

    fireEvent.click(button)
    expect(await screen.findByRole('status')).toHaveTextContent(i18n.t('agentsOffice.loading'))
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()

    release()
    expect(await screen.findByRole('dialog', { name: 'fake' })).toBeInTheDocument()
    await waitFor(() => expect(screen.queryByRole('status')).not.toBeInTheDocument())
  })

  it('gives the focus back to the button even if the visitor moved it while waiting', async () => {
    let release!: () => void
    const gate = new Promise<void>((resolve) => (release = resolve))
    const button = await renderWith(async () => {
      await gate
      return vi.importActual<Record<string, unknown>>('./AgentsOfficeModal')
    })

    fireEvent.click(button)
    await screen.findByRole('status')
    ;(document.activeElement as HTMLElement | null)?.blur() // the visitor taps somewhere else
    release()

    await screen.findByRole('dialog', {}, { timeout: 8000 })
    await userEvent.keyboard('{Escape}')
    await waitForElementToBeRemoved(() => screen.queryByRole('dialog'))
    expect(button).toHaveFocus()
  })
})
