// @vitest-environment node
import { describe, expect, it } from 'vitest'
import { createRateLimiter } from './rateLimit'

function setup(options: { perMinute?: number; perHour?: number } = {}) {
  let time = 0
  const limiter = createRateLimiter({ perMinute: 3, perHour: 5, ...options, now: () => time })
  return { limiter, advance: (ms: number) => (time += ms) }
}

describe('createRateLimiter', () => {
  it('allows requests up to the per-minute limit and blocks the next one', () => {
    const { limiter } = setup()
    expect([1, 2, 3].map(() => limiter.check('1.1.1.1'))).toEqual([true, true, true])
    expect(limiter.check('1.1.1.1')).toBe(false)
  })

  it('recovers once the minute window has passed', () => {
    const { limiter, advance } = setup()
    for (let i = 0; i < 3; i++) limiter.check('1.1.1.1')
    expect(limiter.check('1.1.1.1')).toBe(false)
    advance(60_001)
    expect(limiter.check('1.1.1.1')).toBe(true)
  })

  it('counts each key separately', () => {
    const { limiter } = setup()
    for (let i = 0; i < 3; i++) limiter.check('1.1.1.1')
    expect(limiter.check('1.1.1.1')).toBe(false)
    expect(limiter.check('2.2.2.2')).toBe(true)
  })

  it('enforces the per-hour limit even when the minute window is free', () => {
    const { limiter, advance } = setup()
    for (let i = 0; i < 5; i++) {
      expect(limiter.check('1.1.1.1')).toBe(true)
      advance(61_000)
    }
    expect(limiter.check('1.1.1.1')).toBe(false)
    advance(60 * 60_000)
    expect(limiter.check('1.1.1.1')).toBe(true)
  })

  it('does not count rejected requests against the limit', () => {
    const { limiter, advance } = setup()
    for (let i = 0; i < 10; i++) limiter.check('1.1.1.1')
    advance(60_001)
    expect(limiter.check('1.1.1.1')).toBe(true)
  })

  it('forgets keys whose requests have all expired', () => {
    const { limiter, advance } = setup()
    limiter.check('1.1.1.1')
    expect(limiter.size()).toBe(1)
    advance(60 * 60_000 + 1)
    limiter.check('2.2.2.2')
    expect(limiter.size()).toBe(1)
  })
})
