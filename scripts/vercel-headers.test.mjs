// @vitest-environment node
import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'

const config = JSON.parse(readFileSync('vercel.json', 'utf8'))
const rule = config.headers.find((entry) => entry.source === '/(.*)')
const header = (name) => rule?.headers.find((h) => h.key === name)?.value

const csp = Object.fromEntries(
  (header('Content-Security-Policy') ?? '')
    .split(';')
    .map((directive) => directive.trim().split(/\s+/))
    .filter(([name]) => name)
    .map(([name, ...sources]) => [name, sources]),
)

describe('security headers of the deployment', () => {
  it('apply to every path', () => {
    expect(rule).toBeDefined()
  })

  it.each([
    ['X-Content-Type-Options', 'nosniff'],
    ['X-Frame-Options', 'DENY'],
    ['Referrer-Policy', 'strict-origin-when-cross-origin'],
  ])('sets %s to %s', (name, value) => {
    expect(header(name)).toBe(value)
  })

  it('turns off the device features the site never uses', () => {
    const policy = header('Permissions-Policy')
    for (const feature of ['camera', 'microphone', 'geolocation']) expect(policy).toContain(`${feature}=()`)
  })

  it('forces HTTPS for two years', () => {
    expect(header('Strict-Transport-Security')).toMatch(/max-age=63072000/)
  })
})

describe('Content-Security-Policy', () => {
  it('cannot be embedded in another site', () => {
    expect(csp['frame-ancestors']).toEqual(["'none'"])
  })

  it('only runs scripts that come from the site itself: no inline code and no eval', () => {
    expect(csp['script-src']).toEqual(["'self'"])
  })

  it('only lets the page call its own origin, which is where the chat endpoint lives', () => {
    expect(csp['connect-src']).toEqual(["'self'"])
  })

  it('allows no plugins and no foreign base URL or form target', () => {
    expect(csp['object-src']).toEqual(["'none'"])
    expect(csp['base-uri']).toEqual(["'self'"])
    expect(csp['form-action']).toEqual(["'self'"])
  })

  it('lets in no origin other than Google Fonts', () => {
    const origins = Object.values(csp)
      .flat()
      .filter((source) => source.startsWith('https://'))
    expect(new Set(origins)).toEqual(new Set(['https://fonts.googleapis.com', 'https://fonts.gstatic.com']))
  })
})
