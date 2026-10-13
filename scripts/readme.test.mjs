// @vitest-environment node
import { existsSync, readdirSync, readFileSync } from 'node:fs'
import { dirname, join, resolve } from 'node:path'
import { describe, expect, it } from 'vitest'

const ROOT = resolve(import.meta.dirname, '..')
const READMES = ['README.md', 'README.es.md']
const ANIMATION = 'docs/images/agents-office.svg'

const read = (file) => readFileSync(join(ROOT, file), 'utf8')

/** name and model of every agent the repository really defines. */
function realAgents() {
  const dir = join(ROOT, '.claude', 'agents')
  return readdirSync(dir)
    .filter((file) => file.endsWith('.md'))
    .map((file) => {
      const frontmatter = read(join('.claude', 'agents', file)).replace(/\r\n/g, '\n').match(/^---\n([\s\S]*?)\n---/)?.[1] ?? ''
      const field = (key) => frontmatter.match(new RegExp(`^${key}:\\s*(.+)$`, 'm'))?.[1].trim()
      return { name: field('name'), model: field('model') }
    })
}

/** Relative targets of markdown links and images, and of src/href attributes. */
function localTargets(markdown) {
  const targets = [
    ...[...markdown.matchAll(/!?\[[^\]]*\]\(([^)\s]+)(?:\s+"[^"]*")?\)/g)].map((m) => m[1]),
    ...[...markdown.matchAll(/(?:src|href)="([^"]+)"/g)].map((m) => m[1]),
  ]
  return targets
    .filter((target) => !/^([a-z][a-z0-9+.-]*:|#|\/\/)/i.test(target))
    .map((target) => target.split('#')[0])
    .filter(Boolean)
}

describe.each(READMES)('%s', (file) => {
  const text = () => read(file)

  it('links to its sibling in the other language', () => {
    const sibling = file === 'README.md' ? 'README.es.md' : 'README.md'
    expect(localTargets(text())).toContain(sibling)
  })

  it('embeds the animated office of agents', () => {
    expect(localTargets(text())).toContain(ANIMATION)
  })

  it('only points to files and folders that exist', () => {
    const missing = localTargets(text()).filter((target) => !existsSync(resolve(ROOT, dirname(file), target)))
    expect(missing).toEqual([])
  })

  it('lists every agent of .claude/agents with its real model', () => {
    const lines = text().split('\n')
    const stale = realAgents().filter(
      ({ name, model }) => !lines.some((line) => line.includes(`\`${name}\``) && line.includes(`\`${model}\``)),
    )
    expect(stale).toEqual([])
  })

  it('never mentions a key or the old public variable', () => {
    expect(text()).not.toMatch(/sk-ant-|VITE_ANTHROPIC/)
  })
})
