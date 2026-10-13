import { describe, expect, it } from 'vitest'
import { deriveMode, otherMode, resolveMode } from './officeMode'
import type { Plan } from './plans'

const plan = (...done: boolean[]): Plan => ({
  issue: 1,
  title: 'Plan',
  issueUrl: null,
  tasks: done.map((isDone, index) => ({ title: `Task ${index + 1}`, done: isDone })),
})

describe('deriveMode', () => {
  it('rests when every task of the plan is done', () => {
    expect(deriveMode(plan(true, true, true))).toBe('resting')
  })

  it('works while any task is pending', () => {
    expect(deriveMode(plan(true, false, true))).toBe('working')
    expect(deriveMode(plan(false, false))).toBe('working')
  })

  it('works when the plan has no tasks, because there is nothing finished', () => {
    expect(deriveMode(plan())).toBe('working')
  })

  it('works when there is no plan at all, as in the first version', () => {
    expect(deriveMode(null)).toBe('working')
  })
})

describe('resolveMode', () => {
  it('follows the plan until the visitor chooses', () => {
    expect(resolveMode('resting', null)).toBe('resting')
    expect(resolveMode('working', null)).toBe('working')
  })

  it('lets the visitor override what the plan says, in both directions', () => {
    expect(resolveMode('resting', 'working')).toBe('working')
    expect(resolveMode('working', 'resting')).toBe('resting')
  })
})

describe('otherMode', () => {
  it('flips between working and resting', () => {
    expect(otherMode('working')).toBe('resting')
    expect(otherMode('resting')).toBe('working')
  })
})
