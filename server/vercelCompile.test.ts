// @vitest-environment node
import { spawnSync } from 'node:child_process'
import { mkdirSync, rmSync, writeFileSync } from 'node:fs'
import { join, resolve } from 'node:path'
import { pathToFileURL } from 'node:url'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'

// Vercel compiles api/*.ts with TypeScript and runs the emitted JavaScript as native ESM,
// leaving import specifiers exactly as written. Vitest and Vite resolve imports on their
// own, and Node 24 can even run .ts directly, so neither notices a specifier that only
// works before compiling. This test reproduces that pipeline: tsc, then plain Node.
const ROOT = resolve('.')
const OUT = join(ROOT, 'node_modules', '.tmp', 'vercel-compile-smoke')

function node(code: string, env: Record<string, string> = {}) {
  const base = Object.fromEntries(Object.entries(process.env).filter(([name]) => name !== 'ANTHROPIC_API_KEY'))
  return spawnSync(process.execPath, ['--input-type=module', '-e', code], {
    encoding: 'utf8',
    env: { ...base, ...env },
  })
}

const callPost = (body: string) => `
  const { POST } = await import(${JSON.stringify(pathToFileURL(join(OUT, 'api', 'chat.js')).href)})
  const res = await POST(new Request('https://diego.example/api/chat', { method: 'POST', body: ${JSON.stringify(body)} }))
  console.log(res.status + ' ' + (await res.text()))
`

describe('api/chat.ts compiled the way Vercel does and run as native ESM', () => {
  beforeAll(() => {
    rmSync(OUT, { recursive: true, force: true })
    mkdirSync(OUT, { recursive: true })
    writeFileSync(join(OUT, 'package.json'), JSON.stringify({ type: 'module' }))

    const tsc = join(ROOT, 'node_modules', 'typescript', 'bin', 'tsc')
    const compile = spawnSync(
      process.execPath,
      [tsc, 'api/chat.ts', '--ignoreConfig', '--outDir', OUT, '--module', 'nodenext', '--moduleResolution', 'nodenext',
       '--target', 'es2023', '--types', 'node', '--skipLibCheck', '--strict'],
      { cwd: ROOT, encoding: 'utf8' },
    )
    if (compile.status !== 0) throw new Error(`tsc failed:\n${compile.stdout}${compile.stderr}`)
  }, 60_000)

  afterAll(() => rmSync(OUT, { recursive: true, force: true }))

  it('loads every module of the import chain, including the SDK', () => {
    const run = node(callPost('{}'), { ANTHROPIC_API_KEY: 'test-key' })
    expect(run.stderr).not.toContain('ERR_MODULE_NOT_FOUND')
    expect(run.stdout.trim()).toBe('400 {"error":"invalid_request"}')
  }, 30_000)

  it('answers not_configured when the key is missing', () => {
    const run = node(callPost('{}'))
    expect(run.stdout.trim()).toBe('500 {"error":"not_configured"}')
  }, 30_000)
})
