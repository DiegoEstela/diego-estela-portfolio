// @vitest-environment node
import { readdirSync, readFileSync } from 'node:fs'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'

// Built from pieces so this file does not match its own search.
const FORBIDDEN = ['VITE_' + 'ANTHROPIC', 'CHATBOT_' + 'SYSTEM_PROMPT', 'api.' + 'anthropic.com', 'dangerous-direct-' + 'browser']

function sourceFiles(dir: string): string[] {
  return readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const path = join(dir, entry.name)
    if (entry.isDirectory()) return sourceFiles(path)
    return /\.(ts|tsx|json|css|html)$/.test(entry.name) ? [path] : []
  })
}

describe('client code', () => {
  it.each(FORBIDDEN)('never mentions %s', (needle) => {
    const offenders = sourceFiles('src')
      .filter((file) => !file.endsWith('noClientSecrets.test.ts'))
      .filter((file) => readFileSync(file, 'utf8').includes(needle))
    expect(offenders).toEqual([])
  })

  it('documents only server-side variables for the chatbot in .env.example', () => {
    const example = readFileSync('.env.example', 'utf8')
    expect(example).not.toContain('VITE_' + 'ANTHROPIC')
    expect(example).toContain('ANTHROPIC_API_KEY=')
    expect(example).toContain('CHAT_MODEL')
  })
})
