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

  it('moves in whole pixel steps, like an old videogame', () => {
    expect(css).toMatch(/office-bob[^;]*steps\(/)
  })

  it('switches every office animation off for prefers-reduced-motion', () => {
    const block = css.match(/@media \(prefers-reduced-motion: reduce\)\s*\{([\s\S]*?)\n\}/)?.[1] ?? ''
    expect(block).toContain('.office-character')
    expect(block).toContain('.office-glow')
    expect(block).toMatch(/animation:\s*none/)
  })
})
