// @vitest-environment node
/// <reference types="node" />
import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'

const css = readFileSync('src/styles/globals.css', 'utf8')

// The office moves on its own, so it must stop for visitors who asked the system for less motion.
describe('office animations', () => {
  it('defines the idle animations', () => {
    expect(css).toMatch(/@keyframes office-bob/)
    expect(css).toMatch(/\.office-character\s*\{[^}]*animation:[^}]*office-bob/)
    expect(css).toMatch(/@keyframes office-glow/)
  })

  it('gives the hero button a gentle pulse', () => {
    expect(css).toMatch(/@keyframes agents-cta-pulse/)
    expect(css).toMatch(/\.agents-cta::after\s*\{[^}]*animation:[^}]*agents-cta-pulse/)
  })

  it('pulses by fading a glow in and out, never by animating box-shadow, which repaints every frame', () => {
    const keyframes = css.match(/@keyframes agents-cta-pulse\s*\{([\s\S]*?)\n\}/)?.[1] ?? ''
    expect(keyframes).toMatch(/opacity:/)
    expect(keyframes).not.toMatch(/box-shadow/)
  })

  it('moves in whole pixel steps, like an old videogame', () => {
    expect(css).toMatch(/office-bob[^;]*steps\(/)
  })

  it('switches every office animation off for prefers-reduced-motion', () => {
    const block = css.match(/@media \(prefers-reduced-motion: reduce\)\s*\{([\s\S]*?)\n\}/)?.[1] ?? ''
    expect(block).toContain('.office-character')
    expect(block).toContain('.office-glow')
    expect(block).toContain('.agents-cta::after')
    expect(block).toMatch(/animation:\s*none/)
  })
})

describe('page layout while the modal is open', () => {
  it('reserves the scrollbar gutter, so locking the scroll does not make the page jump sideways', () => {
    expect(css).toMatch(/html\s*\{[^}]*scrollbar-gutter:\s*stable/)
  })
})
