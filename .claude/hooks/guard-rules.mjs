// Reglas deterministas que bloquean acciones peligrosas antes de ejecutarlas.
// Lógica pura y testeable: guard.mjs solo lee stdin y aplica el resultado.

const BASH_RULES = [
  {
    pattern: /\bgit\s+add\s+(?:-A\b|--all\b|\.(?=\s|$|&|;|\|))/,
    reason: 'Prohibido `git add -A`, `--all` y `git add .`: añade los ficheros por nombre.',
  },
  { pattern: /--no-verify\b/, reason: 'Prohibido `--no-verify`: los hooks de git no se saltan.' },
  { pattern: /\bgit\s+commit\b[^\n]*--amend\b/, reason: 'Prohibido `git commit --amend`: crea un commit nuevo.' },
  {
    pattern: /\bgit\s+push\b[^\n]*(?:--force(?!-with-lease)\b|\s-f\b)/,
    reason: 'Prohibido el force push sin `--force-with-lease` y sin confirmación explícita.',
  },
]

// .env, .env.local, .env.production... pero no .env.example
const SEP = String.raw`[\\/]`
const PROTECTED_FILE = new RegExp(String.raw`(?:^|${SEP})\.env(?:\.(?!example$)[^\\/]+)?$`)

const HEREDOC = new RegExp(String.raw`<<-?\s*(['"]?)(\w+)\1[^\n]*\n[\s\S]*?\n\s*\2(?=\s|$|\))`, 'g')
const QUOTED = /"[^"]*"|'[^']*'/g

// Deja solo la parte "ejecutable" del comando: los mensajes de commit y los
// textos entre comillas pueden mencionar `git add -A` sin que sea una orden.
// Limitación asumida: `bash -c "git add -A"` no se detecta; el guard cubre
// errores honestos, no es una frontera de seguridad.
function stripText(command) {
  return command.replace(HEREDOC, '').replace(QUOTED, '""')
}

export function checkToolCall({ tool_name: tool, tool_input: input = {} }) {
  if (tool === 'Bash' && typeof input.command === 'string') {
    const executable = stripText(input.command)
    const hit = BASH_RULES.find((rule) => rule.pattern.test(executable))
    if (hit) return { block: true, reason: hit.reason }
  }
  if ((tool === 'Write' || tool === 'Edit') && typeof input.file_path === 'string') {
    if (PROTECTED_FILE.test(input.file_path)) {
      return { block: true, reason: 'Los ficheros .env* contienen secretos: edítalos tú a mano (usa .env.example).' }
    }
  }
  return { block: false }
}
