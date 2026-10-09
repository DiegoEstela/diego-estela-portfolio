import { afterEach, describe, expect, it, vi } from 'vitest'
import { act, fireEvent, render, screen, waitForElementToBeRemoved } from '@testing-library/react'
import i18n from '@/i18n'
import { ChatContext } from '@/context/ChatContext'
import { ChatWindow } from './ChatWindow'

function renderChat(isOpen = true) {
  const ui = (open: boolean) => (
    <ChatContext.Provider value={{ isOpen: open, setIsOpen: () => {} }}>
      <ChatWindow />
    </ChatContext.Provider>
  )
  const utils = render(ui(isOpen))
  return { ...utils, setOpen: (open: boolean) => utils.rerender(ui(open)) }
}

describe('ChatWindow greeting', () => {
  afterEach(async () => {
    await act(() => i18n.changeLanguage('es'))
  })

  it('shows the initial greeting when the chat is open', async () => {
    await act(() => i18n.changeLanguage('es'))
    renderChat()
    expect(await screen.findByText(i18n.t('chatbot.initial'))).toBeInTheDocument()
  })

  it('translates the greeting when the language changes', async () => {
    await act(() => i18n.changeLanguage('es'))
    renderChat()
    await act(() => i18n.changeLanguage('en'))
    expect(await screen.findByText(i18n.t('chatbot.initial'))).toBeInTheDocument()
    expect(i18n.t('chatbot.initial')).toMatch(/^Hi!/)
  })
})

describe('ChatWindow conversation', () => {
  afterEach(async () => {
    vi.unstubAllEnvs()
    await act(() => i18n.changeLanguage('es'))
  })

  async function sendMessage(text: string) {
    // Without an API key the component answers locally and never hits the network
    vi.stubEnv('VITE_ANTHROPIC_API_KEY', '')
    fireEvent.change(screen.getByPlaceholderText(i18n.t('chatbot.placeholder')), { target: { value: text } })
    fireEvent.click(screen.getByRole('button'))
    expect(await screen.findByText(text)).toBeInTheDocument()
  }

  it('keeps the conversation when the language changes', async () => {
    await act(() => i18n.changeLanguage('es'))
    renderChat()
    await sendMessage('hola desde el test')
    await act(() => i18n.changeLanguage('en'))
    expect(screen.getByText('hola desde el test')).toBeInTheDocument()
  })

  it('keeps the conversation when the chat is closed and reopened', async () => {
    await act(() => i18n.changeLanguage('es'))
    const { setOpen } = renderChat()
    await sendMessage('mensaje persistente')
    setOpen(false)
    await waitForElementToBeRemoved(() => screen.queryByText('mensaje persistente'))
    setOpen(true)
    expect(await screen.findByText('mensaje persistente')).toBeInTheDocument()
  })

  it('translates error messages when the language changes', async () => {
    await act(() => i18n.changeLanguage('es'))
    renderChat()
    await sendMessage('hola')
    expect(await screen.findByText(i18n.t('chatbot.error'))).toBeInTheDocument()
    await act(() => i18n.changeLanguage('en'))
    expect(await screen.findByText(i18n.t('chatbot.error'))).toBeInTheDocument()
    expect(i18n.t('chatbot.error')).not.toBe(i18n.getFixedT('es')('chatbot.error'))
  })
})
