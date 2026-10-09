import { PROVIDER_ERROR_STATUS, ProviderError } from './providerError.js'
import type { RateLimiter } from './rateLimit.js'
import { SYSTEM_PROMPT } from './systemPrompt.js'
import { parseChatRequest, type ChatTurn } from './validate.js'

export interface ChatDeps {
  /** Asks the model for a reply. Injected so the handler can be tested without the network. */
  complete: (input: { system: string; messages: ChatTurn[] }) => Promise<string>
  limiter: RateLimiter
}

/** A valid request is at most ~16k chars; anything much bigger is not a chat message. */
const MAX_BODY_BYTES = 100_000

function json(status: number, body: unknown, headers: Record<string, string> = {}): Response {
  return Response.json(body, { status, headers: { 'Cache-Control': 'no-store', ...headers } })
}

/** On Vercel the first hop of x-forwarded-for is the real client: the platform overwrites any value the client sends. Elsewhere it can be spoofed. */
function clientKey(request: Request): string {
  const forwarded = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim()
  return forwarded || request.headers.get('x-real-ip') || 'unknown'
}

/**
 * Blocks browsers on other sites from using this endpoint. Non-browser clients can still
 * spoof Origin and Host; Sec-Fetch-Site cannot be forged from page JavaScript.
 */
function isForeignOrigin(request: Request): boolean {
  const site = request.headers.get('sec-fetch-site')
  if (site && site !== 'same-origin' && site !== 'none') return true

  const origin = request.headers.get('origin')
  if (!origin) return false
  const host = request.headers.get('host') ?? new URL(request.url).host
  try {
    return new URL(origin).host !== host
  } catch {
    return true
  }
}

type BodyResult = { tooLarge: true } | { tooLarge: false; value: unknown }

/**
 * Reads the JSON body with a hard cap. content-length is only a hint (chunked requests
 * omit it), so the stream itself is counted and cancelled once it passes the limit.
 */
async function readJsonBody(request: Request): Promise<BodyResult> {
  if (!request.body) return { tooLarge: false, value: null }
  const reader = request.body.getReader()
  const chunks: Uint8Array<ArrayBuffer>[] = []
  let total = 0
  for (;;) {
    const { done, value } = await reader.read()
    if (done) break
    total += value.byteLength
    if (total > MAX_BODY_BYTES) {
      await reader.cancel()
      return { tooLarge: true }
    }
    chunks.push(value as Uint8Array<ArrayBuffer>)
  }
  try {
    return { tooLarge: false, value: JSON.parse(await new Blob(chunks).text()) }
  } catch {
    return { tooLarge: false, value: null }
  }
}

export async function handleChat(request: Request, deps: ChatDeps): Promise<Response> {
  if (request.method !== 'POST') return json(405, { error: 'method_not_allowed' }, { Allow: 'POST' })
  if (isForeignOrigin(request)) return json(403, { error: 'forbidden_origin' })
  if (!deps.limiter.check(clientKey(request))) return json(429, { error: 'rate_limit' })

  // Cheap early exit when the client declares a huge body; the stream is capped below regardless.
  if (Number(request.headers.get('content-length')) > MAX_BODY_BYTES) return json(413, { error: 'invalid_request' })

  const body = await readJsonBody(request)
  if (body.tooLarge) return json(413, { error: 'invalid_request' })
  const parsed = parseChatRequest(body.value)
  if (!parsed.ok) return json(400, { error: 'invalid_request' })

  try {
    const reply = await deps.complete({ system: SYSTEM_PROMPT, messages: parsed.messages })
    if (reply.trim() === '') return json(502, { error: 'upstream' })
    return json(200, { reply })
  } catch (error) {
    // Provider details (messages, stacks, keys) never reach the client.
    const kind = error instanceof ProviderError ? error.kind : 'upstream'
    // Only the kind, the status and the error class: never the message, which could carry secrets.
    console.error('[chat] provider failure', {
      kind,
      status: error instanceof ProviderError ? error.status : undefined,
      type: error instanceof Error ? error.name : typeof error,
    })
    return json(PROVIDER_ERROR_STATUS[kind], { error: kind })
  }
}
