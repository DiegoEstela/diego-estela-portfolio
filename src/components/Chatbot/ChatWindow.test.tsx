import { afterEach, describe, expect, it, vi } from 'vitest'
import { act, fireEvent, render, screen, waitForElementToBeRemoved } from '@testing-library/react'
import i18n from '@/i18n'
import { ChatContext } from '@/context/ChatContext'
import { ChatWindow } from './ChatWindow'

function fetchReturning(status: number, body: unknown) {
  return vi.fn().mockResolvedValue(Response.json(body, { status }))
}

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
    vi.unstubAllGlobals()
    await act(() => i18n.changeLanguage('es'))
  })

  async function sendMessage(text: string) {
    // The server fails, so the component answers with its own error message
    vi.stubGlobal('fetch', fetchReturning(502, { error: 'upstream' }))
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

describe('ChatWindow server contract', () => {
  afterEach(async () => {
    vi.unstubAllGlobals()
    await act(() => i18n.changeLanguage('es'))
  })

  async function ask(text: string, fetchMock: ReturnType<typeof vi.fn>) {
    vi.stubGlobal('fetch', fetchMock)
    await act(() => i18n.changeLanguage('es'))
    renderChat()
    fireEvent.change(screen.getByPlaceholderText(i18n.t('chatbot.placeholder')), { target: { value: text } })
    fireEvent.click(screen.getByRole('button'))
  }

  it('posts the conversation to /api/chat without any api key header', async () => {
    const fetchMock = fetchReturning(200, { reply: 'Trabaja con React' })
    await ask('¿qué usa?', fetchMock)

    expect(await screen.findByText('Trabaja con React')).toBeInTheDocument()
    expect(fetchMock).toHaveBeenCalledTimes(1)
    const [url, init] = fetchMock.mock.calls[0]
    expect(url).toBe('/api/chat')
    expect(init.method).toBe('POST')
    expect(JSON.stringify(init.headers).toLowerCase()).not.toContain('api-key')
    expect(JSON.parse(init.body)).toEqual({ messages: [{ role: 'user', content: '¿qué usa?' }] })
  })

  it('sends only role and content of previous messages', async () => {
    const fetchMock = fetchReturning(200, { reply: 'ok' })
    await ask('primera', fetchMock)
    await screen.findByText('ok')
    const body = JSON.parse(fetchMock.mock.calls[0][1].body)
    for (const message of body.messages) expect(Object.keys(message).sort()).toEqual(['content', 'role'])
  })

  it.each([
    [402, 'no_credits', 'chatbot.no_credits'],
    [429, 'rate_limit', 'chatbot.rate_limit'],
    [502, 'upstream', 'chatbot.error'],
    [400, 'invalid_request', 'chatbot.error'],
    [500, 'not_configured', 'chatbot.error'],
  ])('shows the matching message for a %i %s response', async (status, error, key) => {
    await ask('hola', fetchReturning(status, { error }))
    expect(await screen.findByText(i18n.t(key))).toBeInTheDocument()
  })

  it('shows the generic error when the network fails', async () => {
    await ask('hola', vi.fn().mockRejectedValue(new TypeError('Failed to fetch')))
    expect(await screen.findByText(i18n.t('chatbot.error'))).toBeInTheDocument()
  })

  it('shows the generic error when the response is not json', async () => {
    await ask('hola', vi.fn().mockResolvedValue(new Response('<html>oops</html>', { status: 502 })))
    expect(await screen.findByText(i18n.t('chatbot.error'))).toBeInTheDocument()
  })
})

describe('ChatWindow input', () => {
  it('limits how much text can be typed in one message', async () => {
    await act(() => i18n.changeLanguage('es'))
    renderChat()
    expect(screen.getByPlaceholderText(i18n.t('chatbot.placeholder'))).toHaveAttribute('maxlength', '1000')
  })
})
