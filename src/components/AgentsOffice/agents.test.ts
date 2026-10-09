import { describe, expect, it } from 'vitest'
import i18n from '@/i18n'
import { canEditFiles, loadAgents, parseAgent, splitTools } from './agents'

const SAMPLE = `---
name: code-reviewer
description: Revisa cambios de código. Úsalo antes de abrir un PR.
tools: Read, Grep, Bash(git diff:*), Bash(git log:*)
model: sonnet
---

Cuerpo del agente que no interesa.
`

describe('splitTools', () => {
  it('splits on commas', () => {
    expect(splitTools('Read, Grep, Glob')).toEqual(['Read', 'Grep', 'Glob'])
  })

  it('keeps a tool with parentheses as a single entry, even if it contains commas', () => {
    expect(splitTools('Read, Bash(git diff:*), Bash(npm run a, b), Edit')).toEqual([
      'Read',
      'Bash(git diff:*)',
      'Bash(npm run a, b)',
      'Edit',
    ])
  })

  it('ignores empty entries', () => {
    expect(splitTools('Read, , Grep,')).toEqual(['Read', 'Grep'])
    expect(splitTools('')).toEqual([])
  })
})

describe('parseAgent', () => {
  it('reads name, description, tools and model from the frontmatter', () => {
    expect(parseAgent(SAMPLE)).toEqual({
      name: 'code-reviewer',
      description: 'Revisa cambios de código. Úsalo antes de abrir un PR.',
      tools: ['Read', 'Grep', 'Bash(git diff:*)', 'Bash(git log:*)'],
      model: 'sonnet',
    })
  })

  it('supports windows line endings', () => {
    expect(parseAgent(SAMPLE.replace(/\n/g, '\r\n'))?.name).toBe('code-reviewer')
  })

  it('returns an empty tool list and model when they are not declared', () => {
    const agent = parseAgent('---\nname: minimal\ndescription: x\n---\n')
    expect(agent).toEqual({ name: 'minimal', description: 'x', tools: [], model: '' })
  })

  it.each([
    ['no frontmatter', 'solo texto'],
    ['frontmatter without name', '---\ndescription: x\n---\n'],
    ['unterminated frontmatter', '---\nname: a\n'],
    ['empty input', ''],
  ])('returns null for %s', (_label, source) => {
    expect(parseAgent(source)).toBeNull()
  })
})

describe('loadAgents', () => {
  it('loads the real agent definitions from .claude/agents', () => {
    const agents = loadAgents()
    expect(agents.map((a) => a.name)).toEqual([
      'code-reviewer',
      'content-copywriter',
      'security-auditor',
      'web-quality-auditor',
    ])
  })

  it('gives every real agent tools and a model, so the cards are never empty', () => {
    for (const agent of loadAgents()) {
      expect(agent.tools.length, agent.name).toBeGreaterThan(0)
      expect(agent.model, agent.name).not.toBe('')
      expect(agent.description, agent.name).not.toBe('')
    }
  })
})

describe('canEditFiles', () => {
  it.each([['Edit'], ['Write'], ['MultiEdit'], ['NotebookEdit'], ['Edit(src/**)']])('is true for %s', (tool) => {
    expect(canEditFiles(['Read', tool])).toBe(true)
  })

  it.each([[['Read', 'Grep', 'Glob']], [['Bash(git diff:*)', 'Read']], [[]]])('is false for %j', (tools) => {
    expect(canEditFiles(tools)).toBe(false)
  })

  it('does not mistake a tool that merely starts with the same letters', () => {
    expect(canEditFiles(['Editor', 'Writer'])).toBe(false)
  })
})

describe('what the cards say versus what the agent files grant', () => {
  const claimsToEdit = /puede editar|can edit/i

  it.each(['es', 'en'])('only claims that an agent can edit when its tools include an edit tool (%s)', (lng) => {
    const t = i18n.getFixedT(lng)
    for (const agent of loadAgents()) {
      const role = t(`agentsOffice.agents.${agent.name}.role`)
      expect(claimsToEdit.test(role), `${agent.name}: "${role}"`).toBe(canEditFiles(agent.tools))
    }
  })
})
