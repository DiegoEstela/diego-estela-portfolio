import { useId } from 'react'
import { useTranslation } from 'react-i18next'
import { Hand } from 'lucide-react'
import { loadAgents, type AgentDefinition } from './agents'
import type { AgentId } from './sprites'

// Read once, when the module loads: the agent files cannot change while the page is open.
const REAL_AGENTS = loadAgents()

/** An agent can change files only if one of its tools is Edit or Write. */
function canEditFiles(tools: readonly string[]): boolean {
  return tools.some((tool) => /^(Edit|Write|MultiEdit|NotebookEdit)(\(|$)/.test(tool))
}

interface AgentCardProps {
  selectedId: AgentId | null
  /** The definitions read from `.claude/agents`. Injectable for tests. */
  agents?: readonly AgentDefinition[]
}

const chip = {
  background: 'var(--bg-primary)',
  border: '1px solid var(--border)',
  color: 'var(--text-primary)',
} as const

export function AgentCard({ selectedId, agents = REAL_AGENTS }: AgentCardProps) {
  const { t } = useTranslation()
  const toolsId = useId()
  const doingId = useId()

  return (
    <div
      aria-live="polite"
      className="rounded-2xl p-4 sm:p-5"
      style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', minHeight: 168 }}
    >
      {selectedId === null ? (
        <p className="flex items-center gap-2 text-sm" style={{ color: 'var(--text-secondary)' }}>
          <Hand size={16} aria-hidden="true" style={{ color: 'var(--accent)' }} />
          {t('agentsOffice.hint')}
        </p>
      ) : (
        <Details id={selectedId} agent={agents.find((a) => a.name === selectedId)} toolsId={toolsId} doingId={doingId} />
      )}
    </div>
  )
}

function Details({
  id,
  agent,
  toolsId,
  doingId,
}: {
  id: AgentId
  agent: AgentDefinition | undefined
  toolsId: string
  doingId: string
}) {
  const { t } = useTranslation()
  const doing = t(`agentsOffice.agents.${id}.doing`, { returnObjects: true }) as unknown
  const activities = Array.isArray(doing) ? (doing as string[]) : []

  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
        <h3 className="text-lg font-bold" style={{ color: 'var(--text-primary)' }}>
          {t(`agentsOffice.agents.${id}.name`)}
        </h3>
        {id === 'claude' ? (
          <span className="rounded-md px-2 py-0.5 text-xs font-semibold text-white" style={{ background: 'var(--accent)' }}>
            {t('agentsOffice.orchestrator')}
          </span>
        ) : (
          <code className="text-xs" style={{ color: 'var(--text-secondary)' }}>
            {id}
          </code>
        )}
        {agent && (
          <span className="rounded-md px-2 py-0.5 text-xs font-medium" style={chip}>
            {canEditFiles(agent.tools) ? t('agentsOffice.canEdit') : t('agentsOffice.readOnly')}
          </span>
        )}
      </div>

      <p className="text-sm leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
        {t(`agentsOffice.agents.${id}.role`)}
      </p>

      <div>
        <p id={doingId} className="mb-1.5 text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--accent)' }}>
          {t('agentsOffice.doingLabel')}
        </p>
        <ul aria-labelledby={doingId} className="list-disc space-y-0.5 pl-5 text-sm" style={{ color: 'var(--text-primary)' }}>
          {activities.map((activity) => (
            <li key={activity}>{activity}</li>
          ))}
        </ul>
      </div>

      {agent && (
        <>
          <div>
            <p id={toolsId} className="mb-1.5 text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--accent)' }}>
              {t('agentsOffice.toolsLabel')}
            </p>
            <ul aria-labelledby={toolsId} className="flex flex-wrap gap-1.5">
              {agent.tools.map((tool) => (
                <li key={tool} className="rounded-md px-2 py-0.5 font-mono text-xs" style={chip}>
                  {tool}
                </li>
              ))}
            </ul>
          </div>

          <p className="flex items-center gap-2 text-sm">
            <span className="text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--accent)' }}>
              {t('agentsOffice.modelLabel')}
            </span>
            <code className="rounded-md px-2 py-0.5 text-xs" style={chip}>
              {agent.model}
            </code>
          </p>
        </>
      )}
    </div>
  )
}
