// @vitest-environment node
import { describe, expect, it, vi } from 'vitest'
import { createChatHandler } from './index'

const request = () =>
  new Request('https://diego.example/api/chat', {
    method: 'POST',
    headers: { 'content-type': 'application/json', host: 'diego.example' },
    body: JSON.stringify({ messages: [{ role: 'user', content: 'hola' }] }),
  })

describe('createChatHandler', () => {
  it('answers not_configured without touching the provider when the api key is missing', async () => {
    const createClient = vi.fn()
    const res = await createChatHandler({}, { createClient })(request())
    expect(res.status).toBe(500)
    expect(await res.json()).toEqual({ error: 'not_configured' })
    expect(createClient).not.toHaveBeenCalled()
  })

  it('builds the client from the server-side key and replies', async () => {
    const create = vi.fn().mockResolvedValue({ content: [{ type: 'text', text: '¡Hola!' }] })
    const createClient = vi.fn().mockReturnValue({ messages: { create } })
    const handler = createChatHandler({ ANTHROPIC_API_KEY: 'test-key', CHAT_MODEL: 'claude-test-model' }, { createClient })

    const res = await handler(request())

    expect(createClient).toHaveBeenCalledWith('test-key')
    expect(create).toHaveBeenCalledWith(expect.objectContaining({ model: 'claude-test-model' }))
    expect(await res.json()).toEqual({ reply: '¡Hola!' })
  })

  it('reuses one client and one rate limiter across requests', async () => {
    const create = vi.fn().mockResolvedValue({ content: [{ type: 'text', text: 'ok' }] })
    const createClient = vi.fn().mockReturnValue({ messages: { create } })
    const handler = createChatHandler({ ANTHROPIC_API_KEY: 'k' }, { createClient })

    for (let i = 0; i < 10; i++) expect((await handler(request())).status).toBe(200)
    expect((await handler(request())).status).toBe(429)
    expect(createClient).toHaveBeenCalledTimes(1)
  })
})
