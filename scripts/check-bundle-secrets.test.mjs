// @vitest-environment node
import { spawnSync } from 'node:child_process'
import { mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { afterEach, describe, expect, it } from 'vitest'
import { findSecrets, promptFingerprints } from './check-bundle-secrets.mjs'

const SCRIPT = join(import.meta.dirname, 'check-bundle-secrets.mjs')
const dirs = []

function bundle(files) {
  const dir = mkdtempSync(join(tmpdir(), 'bundle-'))
  dirs.push(dir)
  for (const [name, content] of Object.entries(files)) {
    const path = join(dir, name)
    mkdirSync(join(path, '..'), { recursive: true })
    writeFileSync(path, content)
  }
  return dir
}

afterEach(() => {
  while (dirs.length) rmSync(dirs.pop(), { recursive: true, force: true })
})

describe('findSecrets', () => {
  it('returns nothing for a clean bundle', () => {
    const dir = bundle({ 'index.html': '<html></html>', 'assets/app.js': 'fetch("/api/chat")' })
    expect(findSecrets(dir)).toEqual([])
  })

  it('finds an anthropic api key, even in nested files', () => {
    const dir = bundle({ 'assets/deep/app.js': 'const k="sk-ant-api03-abcdefghijklmnop";' })
    const found = findSecrets(dir)
    expect(found).toHaveLength(1)
    expect(found[0].file).toContain('app.js')
    expect(found[0].rule).toMatch(/api key/i)
  })

  it('finds a leaked VITE_ anthropic variable name', () => {
    const dir = bundle({ 'assets/app.js': 'import.meta.env.' + 'VITE_' + 'ANTHROPIC_API_KEY' })
    expect(findSecrets(dir)).toHaveLength(1)
  })

  it('finds the server-side system prompt', () => {
    const dir = bundle({ 'assets/app.js': `x="${promptFingerprints()[0]}"` })
    expect(findSecrets(dir)).toHaveLength(1)
  })

  it('does not echo the secret itself', () => {
    const dir = bundle({ 'app.js': 'sk-ant-api03-abcdefghijklmnop' })
    expect(JSON.stringify(findSecrets(dir))).not.toContain('abcdefghijklmnop')
  })
})

describe('findSecrets: patterns derived from the real system prompt', () => {
  const promptSource = readFileSync(join(import.meta.dirname, '..', 'server', 'chat', 'systemPrompt.ts'), 'utf8')
  const longLines = promptSource
    .split('\n')
    .map((l) => l.trim())
    .filter((l) => l.length >= 60 && !l.startsWith('//'))

  it('has long lines to derive fragments from', () => {
    expect(longLines.length).toBeGreaterThan(2)
  })

  it('finds a line from the middle of the prompt, not only its first sentence', () => {
    const middle = longLines[longLines.length - 1].replace(/^[-\s]+/, '').replace(/`;?$/, '')
    const dir = bundle({ 'assets/app.js': 'x="' + middle.slice(0, 80) + '"' })
    expect(findSecrets(dir).map((f) => f.rule)).toContain('Server-side system prompt')
  })

  it('finds generic provider keys, not only Anthropic ones', () => {
    const dir = bundle({ 'assets/app.js': 'k="sk-proj-abcdefghijklmnopqrstuvwxyz0123456789"' })
    expect(findSecrets(dir)).toHaveLength(1)
  })

  it('does not flag short, ordinary text that merely resembles a key prefix', () => {
    const dir = bundle({ 'assets/app.js': 'const style = "sk-ip-this"; const n = "task-list-item"' })
    expect(findSecrets(dir)).toEqual([])
  })
})

describe('check-bundle-secrets cli', () => {
  const run = (dir) => spawnSync(process.execPath, [SCRIPT, dir], { encoding: 'utf8' })

  it('exits 0 for a clean bundle', () => {
    expect(run(bundle({ 'index.html': 'ok' })).status).toBe(0)
  })

  it('exits 1 and names the file when a secret is found', () => {
    const result = run(bundle({ 'app.js': 'sk-ant-api03-abcdefghijklmnop' }))
    expect(result.status).toBe(1)
    expect(result.stderr).toContain('app.js')
  })

  it('fails closed when the directory does not exist', () => {
    const result = run(join(tmpdir(), 'does-not-exist-' + Date.now()))
    expect(result.status).toBe(1)
  })
})

describe('wiring', () => {
  it('runs as part of the production build, so Vercel fails too, not only CI', () => {
    const pkg = JSON.parse(readFileSync(join(import.meta.dirname, '..', 'package.json'), 'utf8'))
    expect(pkg.scripts.build).toContain('check-bundle-secrets')
  })
})
