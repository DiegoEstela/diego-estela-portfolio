import { describe, expect, it } from 'vitest'
import { checkToolCall } from './guard-rules.mjs'

const bash = (command) => ({ tool_name: 'Bash', tool_input: { command } })
const write = (file_path, tool_name = 'Write') => ({ tool_name, tool_input: { file_path } })

describe('guard rules: Bash', () => {
  it.each([
    'git add -A',
    'git add --all',
    'git add .',
    'git add . && git commit -m "x"',
    'git commit --no-verify -m "x"',
    'git commit --amend',
    'git push --force origin main',
    'git push -f',
  ])('blocks %s', (command) => {
    expect(checkToolCall(bash(command))).toMatchObject({ block: true })
  })

  it.each([
    'git add src/App.tsx',
    'git add docs/plans/11-fix.md src/test/setup.ts',
    'git commit -m "feat: add thing"',
    'git push -u origin feat/18-agents-office',
    'git push --force-with-lease origin feat/x',
    'npm run lint',
  ])('allows %s', (command) => {
    expect(checkToolCall(bash(command))).toEqual({ block: false })
  })
})

describe('guard rules: text inside quotes and heredocs is not a command', () => {
  it.each([
    'git commit -m "docs: explain why git add -A is forbidden"',
    "git commit -m 'block --no-verify and --amend'",
    'git commit -m "$(cat <<\'EOF\'\nfeat: block git add .\n\nbody mentions --no-verify\nEOF\n)"',
    'echo "git push --force"',
  ])('allows %j', (command) => {
    expect(checkToolCall(bash(command))).toEqual({ block: false })
  })

  it('still blocks a real command that follows quoted text', () => {
    expect(checkToolCall(bash('git commit -m "ok" && git add -A'))).toMatchObject({ block: true })
  })
})

describe('guard rules: files', () => {
  it.each(['.env', '.env.local', String.raw`C:\repo\.env.production`, '/repo/.env.development.local'])(
    'blocks writing %s',
    (path) => {
      expect(checkToolCall(write(path))).toMatchObject({ block: true })
      expect(checkToolCall(write(path, 'Edit'))).toMatchObject({ block: true })
    },
  )

  it.each(['.env.example', 'src/environment.ts', 'docs/env-setup.md'])('allows writing %s', (path) => {
    expect(checkToolCall(write(path))).toEqual({ block: false })
  })

  it('ignores other tools', () => {
    expect(checkToolCall({ tool_name: 'Read', tool_input: { file_path: '.env' } })).toEqual({ block: false })
  })
})
