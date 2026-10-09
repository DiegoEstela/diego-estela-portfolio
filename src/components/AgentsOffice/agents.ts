export interface AgentDefinition {
  name: string
  description: string
  tools: string[]
  model: string
}

/** An agent can change files only if one of its tools is Edit or Write (or a variant of them). */
export function canEditFiles(tools: readonly string[]): boolean {
  return tools.some((tool) => /^(Edit|Write|MultiEdit|NotebookEdit)(\(|$)/.test(tool))
}

/**
 * Splits "Read, Bash(git diff:*), Edit" into tools. Commas inside parentheses belong to a
 * single tool, e.g. Bash(npm run a, b).
 */
export function splitTools(raw: string): string[] {
  const tools: string[] = []
  let depth = 0
  let current = ''
  for (const char of raw) {
    if (char === '(') depth++
    if (char === ')') depth = Math.max(0, depth - 1)
    if (char === ',' && depth === 0) {
      tools.push(current)
      current = ''
    } else {
      current += char
    }
  }
  tools.push(current)
  return tools.map((tool) => tool.trim()).filter(Boolean)
}

/** Reads the YAML-ish frontmatter of a Claude Code agent file. Returns null if it has no name. */
export function parseAgent(source: string): AgentDefinition | null {
  const match = source.replace(/\r\n/g, '\n').match(/^---\n([\s\S]*?)\n---(?:\n|$)/)
  if (!match) return null

  const fields: Record<string, string> = {}
  for (const line of match[1].split('\n')) {
    const separator = line.indexOf(':')
    if (separator > 0) fields[line.slice(0, separator).trim()] = line.slice(separator + 1).trim()
  }

  if (!fields.name) return null
  return {
    name: fields.name,
    description: fields.description ?? '',
    tools: splitTools(fields.tools ?? ''),
    model: fields.model ?? '',
  }
}

// Read at build time, so the cards always show what the repository really defines.
const files = import.meta.glob('../../../.claude/agents/*.md', {
  query: '?raw',
  import: 'default',
  eager: true,
}) as Record<string, string>

export function loadAgents(): AgentDefinition[] {
  return Object.values(files)
    .map(parseAgent)
    .filter((agent): agent is AgentDefinition => agent !== null)
    .sort((a, b) => a.name.localeCompare(b.name))
}
