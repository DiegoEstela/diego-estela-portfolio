// Hook PreToolUse: bloquea (exit 2) las llamadas que incumplen las reglas del proyecto.
import { checkToolCall } from './guard-rules.mjs'

let raw = ''
process.stdin.on('data', (chunk) => (raw += chunk))
process.stdin.on('end', () => {
  let event
  try {
    event = JSON.parse(raw)
  } catch {
    process.exit(0) // entrada ilegible: no bloquear por error del hook
  }
  const result = checkToolCall(event)
  if (result.block) {
    console.error(`Bloqueado por .claude/hooks/guard.mjs: ${result.reason}`)
    process.exit(2)
  }
})
