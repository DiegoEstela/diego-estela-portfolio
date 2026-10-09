import { ProviderError } from './providerError.js'
import type { ChatTurn } from './validate.js'

export const DEFAULT_MODEL = 'claude-haiku-4-5'
export const MAX_TOKENS = 512

/** The slice of the Anthropic SDK this module needs; lets tests pass a fake. */
export interface MessagesClient {
  messages: {
    create(params: {
      model: string
      max_tokens: number
      system: string
      messages: ChatTurn[]
    }): Promise<{ content: Array<{ type: string; text?: string }> }>
  }
}

/** Reduces any SDK or network failure to a code that is safe to expose. */
export function toProviderError(error: unknown): ProviderError {
  const { status, type, message } = (typeof error === 'object' && error !== null ? error : {}) as {
    status?: number
    type?: string | null
    message?: string
  }
  if (status === 402 || type === 'billing_error' || message?.toLowerCase().includes('credit')) {
    return new ProviderError('no_credits', status)
  }
  if (status === 429) return new ProviderError('rate_limit', status)
  return new ProviderError('upstream', status)
}

export function createAnthropicCompleter(client: MessagesClient, model: string = DEFAULT_MODEL) {
  return async ({ system, messages }: { system: string; messages: ChatTurn[] }): Promise<string> => {
    try {
      const response = await client.messages.create({ model, max_tokens: MAX_TOKENS, system, messages })
      const block = response.content.find((b) => b.type === 'text')
      return block?.text ?? ''
    } catch (error) {
      throw toProviderError(error)
    }
  }
}
