// Hook PostToolUse: ejecuta ESLint sobre el fichero TS/TSX recién editado y
// devuelve los errores a Claude (exit 2) para que los corrija en el momento.
import { spawnSync } from 'node:child_process'

let raw = ''
process.stdin.on('data', (chunk) => (raw += chunk))
process.stdin.on('end', () => {
  let file
  try {
    file = JSON.parse(raw)?.tool_input?.file_path
  } catch {
    process.exit(0)
  }
  if (typeof file !== 'string' || !/\.(ts|tsx)$/.test(file)) process.exit(0)

  const run = spawnSync('npx', ['eslint', '--no-warn-ignored', file], { encoding: 'utf8', shell: true })
  if (run.status !== 0) {
    console.error(`ESLint encontró problemas en ${file}:\n${run.stdout}${run.stderr}`)
    process.exit(2)
  }
})
