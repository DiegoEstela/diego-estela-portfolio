import { describe, expect, it } from 'vitest'
import en from './en.json'
import es from './es.json'

function flatKeys(obj: unknown, prefix = ''): string[] {
  if (obj === null || typeof obj !== 'object') return [prefix]
  return Object.entries(obj as Record<string, unknown>).flatMap(([k, v]) =>
    flatKeys(v, prefix ? `${prefix}.${k}` : k),
  )
}

describe('locales', () => {
  it('es and en define the same keys', () => {
    expect(flatKeys(es).sort()).toEqual(flatKeys(en).sort())
  })
})
