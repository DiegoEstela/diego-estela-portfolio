import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { act, renderHook } from '@testing-library/react'
import { useSpotlight } from './useSpotlight'

const IDS = ['claude', 'code-reviewer', 'content-copywriter'] as const
const STEP = 3500

beforeEach(() => vi.useFakeTimers())
afterEach(() => vi.useRealTimers())

const tick = (times = 1) => act(() => void vi.advanceTimersByTime(STEP * times))

describe('useSpotlight', () => {
  it('starts on the first character', () => {
    const { result } = renderHook(() => useSpotlight(IDS, { enabled: true }))
    expect(result.current.activeId).toBe('claude')
    expect(result.current.round).toBe(0)
  })

  it('passes the spotlight to the next character every few seconds', () => {
    const { result } = renderHook(() => useSpotlight(IDS, { enabled: true }))
    tick()
    expect(result.current.activeId).toBe('code-reviewer')
    tick()
    expect(result.current.activeId).toBe('content-copywriter')
  })

  it('wraps around and counts the completed rounds', () => {
    const { result } = renderHook(() => useSpotlight(IDS, { enabled: true }))
    tick(3)
    expect(result.current.activeId).toBe('claude')
    expect(result.current.round).toBe(1)
    tick(3)
    expect(result.current.round).toBe(2)
  })

  it('does not move before the interval has passed', () => {
    const { result } = renderHook(() => useSpotlight(IDS, { enabled: true }))
    act(() => void vi.advanceTimersByTime(STEP - 1))
    expect(result.current.activeId).toBe('claude')
  })

  it('has no spotlight and never rotates while disabled (reduced motion)', () => {
    const { result } = renderHook(() => useSpotlight(IDS, { enabled: false }))
    expect(result.current.activeId).toBeNull()
    tick(5)
    expect(result.current.activeId).toBeNull()
    expect(vi.getTimerCount()).toBe(0)
  })

  it('stays on the pinned character, even with the rotation disabled', () => {
    const { result } = renderHook(() => useSpotlight(IDS, { enabled: false, pinnedId: 'content-copywriter' }))
    expect(result.current.activeId).toBe('content-copywriter')
    tick(5)
    expect(result.current.activeId).toBe('content-copywriter')
  })

  it('pauses on the pinned character and resumes where it left off', () => {
    const { result, rerender } = renderHook(({ pinnedId }) => useSpotlight(IDS, { enabled: true, pinnedId }), {
      initialProps: { pinnedId: null as (typeof IDS)[number] | null },
    })
    tick()
    expect(result.current.activeId).toBe('code-reviewer')

    rerender({ pinnedId: 'content-copywriter' })
    tick(4)
    expect(result.current.activeId).toBe('content-copywriter')

    rerender({ pinnedId: null })
    expect(result.current.activeId).toBe('code-reviewer')
    tick()
    expect(result.current.activeId).toBe('content-copywriter')
  })

  it('stops its timer when it unmounts', () => {
    const { unmount } = renderHook(() => useSpotlight(IDS, { enabled: true }))
    expect(vi.getTimerCount()).toBe(1)
    unmount()
    expect(vi.getTimerCount()).toBe(0)
  })

  it('starts and stops following the enabled flag', () => {
    const { result, rerender } = renderHook(({ enabled }) => useSpotlight(IDS, { enabled }), {
      initialProps: { enabled: false },
    })
    expect(vi.getTimerCount()).toBe(0)
    rerender({ enabled: true })
    expect(result.current.activeId).toBe('claude')
    tick()
    expect(result.current.activeId).toBe('code-reviewer')
    rerender({ enabled: false })
    expect(vi.getTimerCount()).toBe(0)
  })
})
