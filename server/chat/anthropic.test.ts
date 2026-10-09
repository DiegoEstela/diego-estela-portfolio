// @vitest-environment node
import { describe, expect, it, vi } from 'vitest'
import { DEFAULT_MODEL, MAX_TOKENS, createAnthropicCompleter, toProviderError } from './anthropic'
import { ProviderError } from './providerError'

const input = { system: 'sé amable', messages: [{ role: 'user' as const, content: 'hola' }] }

function clientReturning(content: unknown[]) {
  return { messages: { create: vi.fn().mockResolvedValue({ content }) } }
}

describe('createAnthropicCompleter', () => {
  it('calls the messages api with the model, token cap, system prompt and messages', async () => {
    const client = clientReturning([{ type: 'text', text: '¡Hola!' }])
    const reply = await createAnthropicCompleter(client)(input)
    expect(reply).toBe('¡Hola!')
    expect(client.messages.create).toHaveBeenCalledWith({
      model: DEFAULT_MODEL,
      max_tokens: MAX_TOKENS,
      system: 'sé amable',
      messages: input.messages,
    })
  })

  it('uses the configured model when given', async () => {
    const client = clientReturning([{ type: 'text', text: 'ok' }])
    await createAnthropicCompleter(client, 'claude-test-model')(input)
    expect(client.messages.create).toHaveBeenCalledWith(expect.objectContaining({ model: 'claude-test-model' }))
  })

  it('returns an empty string when the reply has no text block', async () => {
    const client = clientReturning([{ type: 'tool_use' }])
    expect(await createAnthropicCompleter(client)(input)).toBe('')
  })

  it('converts provider failures into ProviderError', async () => {
    const client = { messages: { create: vi.fn().mockRejectedValue(Object.assign(new Error('x'), { status: 429 })) } }
    await expect(createAnthropicCompleter(client)(input)).rejects.toMatchObject({ kind: 'rate_limit' })
  })
})

describe('toProviderError', () => {
  it.each([
    ['http 402', { status: 402 }, 'no_credits'],
    ['billing_error type', { status: 400, type: 'billing_error' }, 'no_credits'],
    ['low credit balance message', { status: 400, message: 'Your credit balance is too low to access the API' }, 'no_credits'],
    ['http 429', { status: 429 }, 'rate_limit'],
    ['http 500', { status: 500 }, 'upstream'],
    ['connection error without status', {}, 'upstream'],
  ])('maps %s to %s', (_name, props, kind) => {
    const error = toProviderError(Object.assign(new Error('boom'), props))
    expect(error).toBeInstanceOf(ProviderError)
    expect(error.kind).toBe(kind)
  })

  it('maps non-error values to upstream', () => {
    expect(toProviderError('weird').kind).toBe('upstream')
  })
})
