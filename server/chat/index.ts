import Anthropic from '@anthropic-ai/sdk'
import { DEFAULT_MODEL, createAnthropicCompleter, type MessagesClient } from './anthropic.ts'
import { handleChat } from './handleChat.ts'
import { createRateLimiter } from './rateLimit.ts'

type Env = Record<string, string | undefined>

interface Options {
  /** Overridable in tests so no real SDK client is built. */
  createClient?: (apiKey: string) => MessagesClient
}

// Without these the SDK waits up to 10 minutes and retries twice, tying up the function.
const defaultCreateClient = (apiKey: string): MessagesClient =>
  new Anthropic({ apiKey, timeout: 20_000, maxRetries: 1 })

/**
 * Wires the chat endpoint. The limiter and the client are created once per
 * instance and reused across invocations, so call this at module scope.
 */
export function createChatHandler(env: Env, { createClient = defaultCreateClient }: Options = {}) {
  const limiter = createRateLimiter({ perMinute: 10, perHour: 40 })
  let complete: ReturnType<typeof createAnthropicCompleter> | undefined

  return async (request: Request): Promise<Response> => {
    const apiKey = env.ANTHROPIC_API_KEY
    if (!apiKey) {
      return Response.json({ error: 'not_configured' }, { status: 500, headers: { 'Cache-Control': 'no-store' } })
    }
    complete ??= createAnthropicCompleter(createClient(apiKey), env.CHAT_MODEL || DEFAULT_MODEL)
    return handleChat(request, { complete, limiter })
  }
}
