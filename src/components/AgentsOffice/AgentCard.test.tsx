import { afterEach, describe, expect, it } from 'vitest'
import { act, render, screen, within } from '@testing-library/react'
import i18n from '@/i18n'
import { AgentCard } from './AgentCard'
import { loadAgents, type AgentDefinition } from './agents'
import { AGENT_IDS } from './sprites'

const reviewer: AgentDefinition = {
  name: 'code-reviewer',
  description: 'x',
  tools: ['Read', 'Grep', 'Bash(git diff:*)'],
  model: 'sonnet',
}
const copywriter: AgentDefinition = {
  name: 'content-copywriter',
  description: 'x',
  tools: ['Read', 'Edit'],
  model: 'opus',
}

async function useLanguage(lng: 'es' | 'en') {
  await act(() => i18n.changeLanguage(lng))
}

afterEach(() => useLanguage('es'))

describe('AgentCard without a selection', () => {
  it('invites the visitor to tap a character', async () => {
    await useLanguage('es')
    render(<AgentCard selectedId={null} agents={[reviewer]} />)
    expect(screen.getByText(i18n.t('agentsOffice.hint'))).toBeInTheDocument()
    expect(screen.queryByRole('heading')).not.toBeInTheDocument()
  })
})

describe('AgentCard with a file-backed agent', () => {
  it('shows the friendly name, the technical id and the translated role', async () => {
    await useLanguage('es')
    render(<AgentCard selectedId="code-reviewer" agents={[reviewer]} />)
    expect(screen.getByRole('heading', { name: i18n.t('agentsOffice.agents.code-reviewer.name') })).toBeInTheDocument()
    expect(screen.getByText('code-reviewer')).toBeInTheDocument()
    expect(screen.getByText(i18n.t('agentsOffice.agents.code-reviewer.role'))).toBeInTheDocument()
  })

  it('lists the tools and the model exactly as the agent file declares them', async () => {
    await useLanguage('es')
    render(<AgentCard selectedId="code-reviewer" agents={[reviewer]} />)
    const tools = screen.getByRole('list', { name: i18n.t('agentsOffice.toolsLabel') })
    expect(within(tools).getAllByRole('listitem').map((li) => li.textContent)).toEqual(['Read', 'Grep', 'Bash(git diff:*)'])
    expect(screen.getByText('sonnet')).toBeInTheDocument()
  })

  it('says whether the agent can edit files, derived from its tools', async () => {
    await useLanguage('es')
    const { rerender } = render(<AgentCard selectedId="code-reviewer" agents={[reviewer, copywriter]} />)
    expect(screen.getByText(i18n.t('agentsOffice.readOnly'))).toBeInTheDocument()
    rerender(<AgentCard selectedId="content-copywriter" agents={[reviewer, copywriter]} />)
    expect(screen.getByText(i18n.t('agentsOffice.canEdit'))).toBeInTheDocument()
  })

  it('lists what the agent does', async () => {
    await useLanguage('es')
    render(<AgentCard selectedId="code-reviewer" agents={[reviewer]} />)
    const list = screen.getByRole('list', { name: i18n.t('agentsOffice.doingLabel') })
    expect(within(list).getAllByRole('listitem').length).toBeGreaterThanOrEqual(2)
  })

  it('still renders when the agent file is missing, without tools or model', async () => {
    await useLanguage('es')
    render(<AgentCard selectedId="code-reviewer" agents={[]} />)
    expect(screen.getByText(i18n.t('agentsOffice.agents.code-reviewer.role'))).toBeInTheDocument()
    expect(screen.queryByText(i18n.t('agentsOffice.toolsLabel'))).not.toBeInTheDocument()
  })
})

describe('AgentCard for the orchestrator', () => {
  it('has no tools, model or edit badge, because it is not an agent file', async () => {
    await useLanguage('es')
    render(<AgentCard selectedId="claude" agents={[reviewer, copywriter]} />)
    expect(screen.getByRole('heading', { name: i18n.t('agentsOffice.agents.claude.name') })).toBeInTheDocument()
    expect(screen.getByText(i18n.t('agentsOffice.orchestrator'))).toBeInTheDocument()
    expect(screen.queryByText(i18n.t('agentsOffice.toolsLabel'))).not.toBeInTheDocument()
    expect(screen.queryByText(i18n.t('agentsOffice.modelLabel'))).not.toBeInTheDocument()
    expect(screen.queryByText(i18n.t('agentsOffice.readOnly'))).not.toBeInTheDocument()
  })
})

describe('AgentCard language', () => {
  it('follows the active language', async () => {
    await useLanguage('es')
    const { rerender } = render(<AgentCard selectedId="security-auditor" agents={[]} />)
    const spanish = screen.getByRole('heading').textContent
    await useLanguage('en')
    rerender(<AgentCard selectedId="security-auditor" agents={[]} />)
    expect(screen.getByRole('heading').textContent).not.toBe(spanish)
    expect(screen.getByText(i18n.t('agentsOffice.agents.security-auditor.role'))).toBeInTheDocument()
  })

  it('announces the selected agent to screen readers', () => {
    const { container } = render(<AgentCard selectedId="claude" agents={[]} />)
    expect(container.querySelector('[aria-live="polite"]')).not.toBeNull()
  })
})

describe('agents office copy', () => {
  it.each(['es', 'en'])('has a name, a role and at least two activities for every character in %s', (lng) => {
    const t = i18n.getFixedT(lng)
    for (const id of AGENT_IDS) {
      expect(t(`agentsOffice.agents.${id}.name`), `${id} name`).not.toBe(`agentsOffice.agents.${id}.name`)
      expect(t(`agentsOffice.agents.${id}.role`), `${id} role`).not.toBe(`agentsOffice.agents.${id}.role`)
      const doing = t(`agentsOffice.agents.${id}.doing`, { returnObjects: true }) as unknown
      expect(Array.isArray(doing), `${id} doing is a list`).toBe(true)
      expect((doing as string[]).length, `${id} doing`).toBeGreaterThanOrEqual(2)
    }
  })

  it('has a card for every real agent file in the repository', () => {
    const t = i18n.getFixedT('es')
    for (const { name } of loadAgents()) {
      expect(AGENT_IDS as readonly string[], `${name} needs a character`).toContain(name)
      expect(t(`agentsOffice.agents.${name}.role`)).not.toBe(`agentsOffice.agents.${name}.role`)
    }
  })
})
