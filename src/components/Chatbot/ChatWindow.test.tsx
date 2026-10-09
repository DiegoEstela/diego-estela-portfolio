import { afterEach, describe, expect, it } from 'vitest'
import { act, render, screen } from '@testing-library/react'
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
