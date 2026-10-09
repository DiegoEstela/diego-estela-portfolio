const MINUTE_MS = 60_000
const HOUR_MS = 60 * MINUTE_MS

export interface RateLimiterOptions {
  perMinute: number
  perHour: number
  /** Injectable clock, mainly for tests. */
  now?: () => number
}

export interface RateLimiter {
  /** Records the request and returns true if it is allowed. Rejected requests are not recorded. */
  check(key: string): boolean
  /** Number of keys currently tracked. */
  size(): number
}

/**
 * Sliding-window limiter kept in memory.
 *
 * Best effort only: each serverless instance has its own memory, so the limit is
 * per instance, not global. The spend limit set in the Anthropic console is the
 * real cost cap; this just stops a single client from hammering one instance.
 */
export function createRateLimiter({ perMinute, perHour, now = Date.now }: RateLimiterOptions): RateLimiter {
  const hits = new Map<string, number[]>()
  let lastSweep = now()

  function sweep(time: number) {
    if (time - lastSweep < MINUTE_MS) return
    lastSweep = time
    for (const [key, times] of hits) {
      if (times[times.length - 1] <= time - HOUR_MS) hits.delete(key)
    }
  }

  return {
    check(key) {
      const time = now()
      sweep(time)

      const recent = (hits.get(key) ?? []).filter((t) => t > time - HOUR_MS)
      const lastMinute = recent.filter((t) => t > time - MINUTE_MS).length
      if (lastMinute >= perMinute || recent.length >= perHour) {
        hits.set(key, recent)
        return false
      }

      recent.push(time)
      hits.set(key, recent)
      return true
    },
    size: () => hits.size,
  }
}
