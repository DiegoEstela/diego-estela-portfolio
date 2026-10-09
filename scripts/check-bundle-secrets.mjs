// Fails if the production bundle contains anything that must stay on the server.
// Usage: node scripts/check-bundle-secrets.mjs [dir]   (default: dist)
import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..')
const PROMPT_FILE = join(ROOT, 'server', 'chat', 'systemPrompt.ts')

// Shortest ASCII run taken from the prompt as a fingerprint. Long enough not to collide
// with ordinary UI text, short enough that editing the prompt rarely removes every run.
const MIN_FINGERPRINT_CHARS = 40

/**
 * Fingerprints of the real system prompt, derived from its source file so that editing
 * the prompt can never silently disable the check. Only ASCII runs are used: a minifier
 * may escape accented characters, but it cannot alter plain ASCII text.
 */
export function promptFingerprints(file = PROMPT_FILE) {
  if (!existsSync(file)) {
    throw new Error(`check-bundle-secrets: cannot read the system prompt at ${file}`)
  }
  const source = readFileSync(file, 'latin1')
  const body = source.slice(source.indexOf('`') + 1, source.lastIndexOf('`'))
  const runs = body.match(new RegExp(`[ -~]{${MIN_FINGERPRINT_CHARS},}`, 'g')) ?? []
  const fingerprints = [...new Set(runs.map((run) => run.trim()).filter((run) => run.length >= MIN_FINGERPRINT_CHARS))]
  if (fingerprints.length === 0) {
    throw new Error('check-bundle-secrets: no fingerprints could be derived from the system prompt')
  }
  return fingerprints
}

function buildRules() {
  const fingerprints = promptFingerprints()
  return [
    // \b avoids matching inside words such as "task-list-item-...".
    { name: 'Secret API key (sk-…)', test: (text) => /\bsk-[a-z0-9]+-[\w-]{10,}/i.test(text) },
    {
      name: 'VITE_ Anthropic variable (would expose the key)',
      test: (text) => text.includes('VITE_' + 'ANTHROPIC'),
    },
    { name: 'Server-side system prompt', test: (text) => fingerprints.some((part) => text.includes(part)) },
    {
      name: 'Direct browser access header for the Anthropic API',
      test: (text) => text.includes('anthropic-dangerous-direct-browser-access'),
    },
  ]
}

function listFiles(dir) {
  return readdirSync(dir).flatMap((name) => {
    const path = join(dir, name)
    return statSync(path).isDirectory() ? listFiles(path) : [path]
  })
}

/** Returns one finding per file and rule. Never includes the matched text itself. */
export function findSecrets(dir) {
  const rules = buildRules()
  const findings = []
  for (const file of listFiles(dir)) {
    const content = readFileSync(file, 'latin1')
    for (const { name, test } of rules) {
      if (test(content)) findings.push({ file, rule: name })
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
