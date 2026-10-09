import { PROVIDER_ERROR_STATUS, ProviderError } from './providerError'
import type { RateLimiter } from './rateLimit'
import { SYSTEM_PROMPT } from './systemPrompt'
import { parseChatRequest, type ChatTurn } from './validate'

export interface ChatDeps {
  /** Asks the model for a reply. Injected so the handler can be tested without the network. */
  complete: (input: { system: string; messages: ChatTurn[] }) => Promise<string>
  limiter: RateLimiter
}

function json(status: number, body: unknown, headers: Record<string, string> = {}): Response {
  return Response.json(body, { status, headers: { 'Cache-Control': 'no-store', ...headers } })
}

/** The first hop of x-forwarded-for is the client; the platform overwrites spoofed values. */
function clientKey(request: Request): string {
  const forwarded = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim()
  return forwarded || request.headers.get('x-real-ip') || 'unknown'
}

/** Blocks browsers on other sites from using this endpoint. Non-browser clients can still spoof it. */
function isForeignOrigin(request: Request): boolean {
  const origin = request.headers.get('origin')
  if (!origin) return false
  const host = request.headers.get('host') ?? new URL(request.url).host
  try {
    return new URL(origin).host !== host
  } catch {
    return true
  }
}

export async function handleChat(request: Request, deps: ChatDeps): Promise<Response> {
  if (request.method !== 'POST') return json(405, { error: 'method_not_allowed' }, { Allow: 'POST' })
  if (isForeignOrigin(request)) return json(403, { error: 'forbidden_origin' })
  if (!deps.limiter.check(clientKey(request))) return json(429, { error: 'rate_limit' })

  const body: unknown = await request.json().catch(() => null)
  const parsed = parseChatRequest(body)
  if (!parsed.ok) return json(400, { error: 'invalid_request' })

  try {
    const reply = await deps.complete({ system: SYSTEM_PROMPT, messages: parsed.messages })
    if (reply.trim() === '') return json(502, { error: 'upstream' })
    return json(200, { reply })
  } catch (error) {
    // Provider details (messages, stacks, keys) never reach the client.
    const kind = error instanceof ProviderError ? error.kind : 'upstream'
    return json(PROVIDER_ERROR_STATUS[kind], { error: kind })
  }
}
