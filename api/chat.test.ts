// @vitest-environment node
import { afterEach, describe, expect, it, vi } from 'vitest'

afterEach(() => vi.unstubAllEnvs())

describe('api/chat function entrypoint', () => {
  it('exports a POST handler that answers over the web Request/Response contract', async () => {
    vi.stubEnv('ANTHROPIC_API_KEY', '')
    const { POST } = await import('./chat.ts')
    const res = await POST(new Request('https://diego.example/api/chat', { method: 'POST', body: '{}' }))
    expect(res).toBeInstanceOf(Response)
    expect(res.status).toBe(500)
    expect(await res.json()).toEqual({ error: 'not_configured' })
  })

  it('rejects other methods with 405 once the key is configured', async () => {
    vi.stubEnv('ANTHROPIC_API_KEY', 'test-key')
    const { GET } = await import('./chat.ts')
    const res = await GET(new Request('https://diego.example/api/chat'))
    expect(res.status).toBe(405)
    expect(res.headers.get('allow')).toBe('POST')
  })
})
