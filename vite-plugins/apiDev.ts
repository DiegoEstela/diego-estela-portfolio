import type { IncomingMessage, ServerResponse } from 'node:http'
import { loadEnv, type Plugin } from 'vite'

/** Converts a Node request into a Web `Request`, as Vercel does in production. */
export async function toWebRequest(req: IncomingMessage): Promise<Request> {
  const headers = new Headers()
  for (const [name, value] of Object.entries(req.headers)) {
    if (value !== undefined) headers.set(name, Array.isArray(value) ? value.join(', ') : value)
  }

  const method = req.method ?? 'GET'
  let body: Buffer | undefined
  if (method !== 'GET' && method !== 'HEAD') {
    const chunks: Buffer[] = []
    for await (const chunk of req) chunks.push(Buffer.from(chunk))
    body = Buffer.concat(chunks)
  }

  const url = `http://${req.headers.host ?? 'localhost'}${req.url ?? '/'}`
  return new Request(url, { method, headers, body })
}

export async function sendWebResponse(res: ServerResponse, response: Response): Promise<void> {
  res.statusCode = response.status
  response.headers.forEach((value, name) => res.setHeader(name, value))
  res.end(Buffer.from(await response.arrayBuffer()))
}

/**
 * Serves `/api/chat` during `npm run dev` with the same handler Vercel runs in
 * production. `ANTHROPIC_API_KEY` is read from `.env.local` and never reaches the client.
 */
export function apiDev(): Plugin {
  return {
    name: 'api-dev',
    apply: 'serve',
    configureServer(server) {
      const env = loadEnv(server.config.mode, server.config.root, '')
      let loaded: unknown
      let handler: ((request: Request) => Promise<Response>) | undefined

      server.middlewares.use('/api/chat', async (req, res) => {
        try {
          // ssrLoadModule returns a fresh module after edits, so rebuild the handler when it changes.
          const mod = (await server.ssrLoadModule('/server/chat/index.ts')) as typeof import('../server/chat')
          if (mod !== loaded) {
            loaded = mod
            handler = mod.createChatHandler(env)
          }
          await sendWebResponse(res, await handler!(await toWebRequest(req)))
        } catch (error) {
          server.config.logger.error(`[api-dev] ${error instanceof Error ? error.message : String(error)}`)
          res.statusCode = 500
          res.setHeader('content-type', 'application/json')
          res.end(JSON.stringify({ error: 'upstream' }))
        }
      })
    },
  }
}
