import { useEffect, useState } from 'react'
import type { AgentId } from './sprites'

interface SpotlightOptions {
  /** When false nothing rotates: used for visitors who asked the system to reduce motion. */
  enabled: boolean
  /** A selected character keeps the spotlight and pauses the rotation. */
  pinnedId?: AgentId | null
  intervalMs?: number
}

/**
 * Passes the spotlight from one character to the next, one at a time. Showing a single speech
 * bubble keeps a small phone screen readable; `round` counts completed laps so each lap can
 * show a different line.
 */
export function useSpotlight(
  ids: readonly AgentId[],
  { enabled, pinnedId = null, intervalMs = 3500 }: SpotlightOptions,
) {
  const [turn, setTurn] = useState(0)
  const rotating = enabled && pinnedId === null

  useEffect(() => {
    if (!rotating) return
    const timer = setInterval(() => setTurn((current) => current + 1), intervalMs)
    return () => clearInterval(timer)
  }, [rotating, intervalMs])

  const activeId = pinnedId ?? (enabled ? ids[turn % ids.length] : null)
  return { activeId, round: Math.floor(turn / ids.length) }
}
