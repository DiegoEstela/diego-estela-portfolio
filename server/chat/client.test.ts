// @vitest-environment node
import Anthropic from '@anthropic-ai/sdk'
import { describe, expect, it, vi } from 'vitest'
import { createChatHandler } from './index.ts'

vi.mock('@anthropic-ai/sdk', () => ({
  default: vi.fn(function () {
    return { messages: { create: vi.fn().mockResolvedValue({ content: [{ type: 'text', text: 'ok' }] }) } }
  }),
}))

describe('default Anthropic client', () => {
  it('bounds latency with a timeout and a single retry', async () => {
    const handler = createChatHandler({ ANTHROPIC_API_KEY: 'test-key' })
    const res = await handler(
      new Request('https://diego.example/api/chat', {
        method: 'POST',
        headers: { 'content-type': 'application/json', host: 'diego.example' },
        body: JSON.stringify({ messages: [{ role: 'user', content: 'hola' }] }),
      }),
    )
    expect(res.status).toBe(200)
    expect(Anthropic).toHaveBeenCalledWith({ apiKey: 'test-key', timeout: 20_000, maxRetries: 1 })
  })
})
