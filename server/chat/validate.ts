export interface ChatTurn {
  role: 'user' | 'assistant'
  content: string
}

export type ParsedChatRequest = { ok: true; messages: ChatTurn[] } | { ok: false }

/** Hard caps that bound the cost of a single request. */
export const LIMITS = {
  maxMessages: 10,
  // Bot replies (max_tokens 512) can reach ~2000 chars, so a full history must fit comfortably.
  maxMessageChars: 4000,
  maxTotalChars: 16000,
} as const

const INVALID: ParsedChatRequest = { ok: false }

function parseTurn(raw: unknown): ChatTurn | null {
  if (typeof raw !== 'object' || raw === null) return null
  const { role, content } = raw as Record<string, unknown>
  if (role !== 'user' && role !== 'assistant') return null
  if (typeof content !== 'string' || content.trim() === '') return null
  if (content.length > LIMITS.maxMessageChars) return null
  return { role, content }
}

/** Validates an untrusted request body and keeps only the fields the model needs. */
export function parseChatRequest(body: unknown): ParsedChatRequest {
  if (typeof body !== 'object' || body === null) return INVALID
  const { messages } = body as Record<string, unknown>
  if (!Array.isArray(messages) || messages.length === 0 || messages.length > LIMITS.maxMessages) return INVALID

  const turns: ChatTurn[] = []
  let total = 0
  for (const raw of messages) {
    const turn = parseTurn(raw)
    if (!turn) return INVALID
    total += turn.content.length
    turns.push(turn)
  }

  if (total > LIMITS.maxTotalChars) return INVALID
  if (turns[turns.length - 1].role !== 'user') return INVALID
  return { ok: true, messages: turns }
}
