// Fails if the production bundle contains anything that must stay on the server.
// Usage: node scripts/check-bundle-secrets.mjs [dir]   (default: dist)
import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs'
import { join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const RULES = [
  { name: 'Anthropic API key', pattern: /sk-ant-[\w-]{10,}/ },
  { name: 'VITE_ Anthropic variable (would expose the key)', pattern: new RegExp('VITE_' + 'ANTHROPIC') },
  { name: 'Server-side system prompt', pattern: /Eres el asistente virtual del portfolio/ },
  { name: 'Direct browser access header for the Anthropic API', pattern: /anthropic-dangerous-direct-browser-access/ },
]

function listFiles(dir) {
  return readdirSync(dir).flatMap((name) => {
    const path = join(dir, name)
    return statSync(path).isDirectory() ? listFiles(path) : [path]
  })
}

/** Returns one finding per file and rule. Never includes the matched text itself. */
export function findSecrets(dir) {
  const findings = []
  for (const file of listFiles(dir)) {
    const content = readFileSync(file, 'latin1')
    for (const { name, pattern } of RULES) {
      if (pattern.test(content)) findings.push({ file, rule: name })
    }
  }
  return findings
}

function main() {
  const dir = resolve(process.argv[2] ?? 'dist')
  if (!existsSync(dir)) {
    console.error(`check-bundle-secrets: "${dir}" does not exist. Build first (npm run build).`)
    process.exit(1)
  }
  const findings = findSecrets(dir)
  if (findings.length > 0) {
    for (const { file, rule } of findings) console.error(`LEAK: ${rule} found in ${file}`)
    process.exit(1)
  }
  console.log(`check-bundle-secrets: ${dir} is clean.`)
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) main()
