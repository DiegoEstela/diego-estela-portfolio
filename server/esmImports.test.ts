// @vitest-environment node
import { readdirSync, readFileSync } from 'node:fs'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'

// Vercel runs api/ as native ESM ("type": "module"), where relative imports need an
// explicit extension. Vitest and Vite resolve extensionless imports, so only this
// check (or a real deploy) catches the mistake.
function shippedFiles(dir: string): string[] {
  return readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const path = join(dir, entry.name)
    if (entry.isDirectory()) return shippedFiles(path)
    return /\.ts$/.test(entry.name) && !/\.test\.ts$/.test(entry.name) ? [path] : []
  })
}

const RELATIVE_SPECIFIER = /(?:from|import)\s*\(?\s*['"](\.{1,2}\/[^'"]*)['"]/g

describe('function entrypoints and their dependencies', () => {
  it('only use relative imports that include the file extension', () => {
    const offenders: string[] = []
    for (const file of [...shippedFiles('api'), ...shippedFiles('server')]) {
      for (const [, specifier] of readFileSync(file, 'utf8').matchAll(RELATIVE_SPECIFIER)) {
        if (!/\.(ts|js|json)$/.test(specifier)) offenders.push(`${file}: ${specifier}`)
      }
    }
    expect(offenders).toEqual([])
  })
})
