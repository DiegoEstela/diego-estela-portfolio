// @vitest-environment node
import { Readable } from 'node:stream'
import type { IncomingMessage, ServerResponse } from 'node:http'
import { describe, expect, it, vi } from 'vitest'
import { sendWebResponse, toWebRequest } from './apiDev'

function nodeRequest(method: string, body?: string, headers: Record<string, string> = {}) {
  const stream = Readable.from(body ? [Buffer.from(body)] : [])
  return Object.assign(stream, {
    method,
    url: '/api/chat?x=1',
    headers: { host: 'localhost:5173', ...headers },
  }) as unknown as IncomingMessage
}

describe('toWebRequest', () => {
  it('rebuilds method, url, headers and body', async () => {
    const request = await toWebRequest(nodeRequest('POST', '{"a":1}', { 'content-type': 'application/json' }))
    expect(request.method).toBe('POST')
    expect(request.url).toBe('http://localhost:5173/api/chat?x=1')
    expect(request.headers.get('content-type')).toBe('application/json')
    expect(request.headers.get('host')).toBe('localhost:5173')
    expect(await request.json()).toEqual({ a: 1 })
  })

  it('sends no body for GET requests', async () => {
    const request = await toWebRequest(nodeRequest('GET'))
    expect(request.method).toBe('GET')
    expect(request.body).toBeNull()
  })

  it('joins repeated headers', async () => {
    const stream = nodeRequest('GET') as unknown as { headers: Record<string, string | string[]> }
    stream.headers['x-forwarded-for'] = ['1.1.1.1', '2.2.2.2']
    const request = await toWebRequest(stream as unknown as IncomingMessage)
    expect(request.headers.get('x-forwarded-for')).toBe('1.1.1.1, 2.2.2.2')
  })
})

describe('sendWebResponse', () => {
  it('writes status, headers and body to the node response', async () => {
    const res = { statusCode: 0, setHeader: vi.fn(), end: vi.fn() }
    await sendWebResponse(
      res as unknown as ServerResponse,
      Response.json({ reply: 'hola' }, { status: 201, headers: { 'Cache-Control': 'no-store' } }),
    )
    expect(res.statusCode).toBe(201)
    expect(res.setHeader).toHaveBeenCalledWith('cache-control', 'no-store')
    expect(res.setHeader).toHaveBeenCalledWith('content-type', 'application/json')
    expect(res.end).toHaveBeenCalledWith(Buffer.from('{"reply":"hola"}'))
  })
})
