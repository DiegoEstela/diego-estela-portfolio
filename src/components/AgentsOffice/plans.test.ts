// @vitest-environment node
/// <reference types="node" />
import { readdirSync, readFileSync } from 'node:fs'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'
import { progress } from './planParser'
import { LATEST_PLAN } from './plans'

describe('LATEST_PLAN', () => {
  it('is the plan of the highest issue number in docs/plans', () => {
    const highest = Math.max(
      ...readdirSync('docs/plans')
        .map((file) => Number(file.match(/^(\d+)-/)?.[1]))
        .filter(Number.isInteger),
    )
    expect(LATEST_PLAN?.issue).toBe(highest)
  })

  it('has a title, a link to its issue and tasks, read from the real file', () => {
    expect(LATEST_PLAN?.title).toBeTruthy()
    expect(LATEST_PLAN?.issueUrl).toMatch(new RegExp(`/issues/${LATEST_PLAN?.issue}$`))
    expect(progress(LATEST_PLAN!).total).toBeGreaterThan(0)
  })
})

describe('what the client may import', () => {
  const dir = 'src/components/AgentsOffice'
  const sources = readdirSync(dir)
    .filter((file) => /\.tsx?$/.test(file) && !file.endsWith('.test.ts') && !file.endsWith('.test.tsx'))
    .map((file) => [file, readFileSync(join(dir, file), 'utf8')] as const)

  it.each(sources)('%s does not bundle the raw text of the plans', (_file, source) => {
    // A glob over docs/plans would put the prose of every plan in the public bundle.
    expect(source).not.toMatch(/glob\([^)]*docs\/plans/)
  })
})
