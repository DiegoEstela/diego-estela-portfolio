// @vitest-environment node
import { readdirSync, readFileSync } from 'node:fs'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'

// Vercel compiles api/*.ts to .js and runs it as native ESM ("type": "module"), keeping
// every import specifier exactly as written. So specifiers must name the *compiled* file:
// './x.js' (TypeScript and Vite resolve it to x.ts). Extensionless fails in native ESM and
// './x.ts' fails after compiling. vercelCompile.test.ts proves it end to end.
function shippedFiles(dir: string): string[] {
  return readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const path = join(dir, entry.name)
    if (entry.isDirectory()) return shippedFiles(path)
    return /\.ts$/.test(entry.name) && !/\.test\.ts$/.test(entry.name) ? [path] : []
  })
}

const RELATIVE_SPECIFIER = /(?:from|import)\s*\(?\s*['"](\.{1,2}\/[^'"]*)['"]/g

describe('function entrypoints and their dependencies', () => {
  it('only use relative imports that name the compiled .js file', () => {
    const offenders: string[] = []
    for (const file of [...shippedFiles('api'), ...shippedFiles('server')]) {
      for (const [, specifier] of readFileSync(file, 'utf8').matchAll(RELATIVE_SPECIFIER)) {
        if (!/\.(js|json)$/.test(specifier)) offenders.push(`${file}: ${specifier}`)
      }
    }
    expect(offenders).toEqual([])
  })
})
