import { afterEach, describe, expect, it } from 'vitest'
import { act, render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import i18n from '@/i18n'
import { AI_PROJECTS } from './aiProjects'
import { ProjectsShowcase } from './ProjectsShowcase'

const name = (id: string) => i18n.t(`agentsOffice.world.projects.items.${id}.name`)
const card = (id: string) => screen.getByRole('button', { name: new RegExp(name(id).replace(/[.*+?^${}()|[\]\\]/g, '\\$&')) })
const repoLink = () => screen.queryByRole('link', { name: new RegExp(i18n.t('agentsOffice.world.projects.repoCta')) })

afterEach(async () => {
  await act(() => i18n.changeLanguage('es'))
})

describe('AI projects', () => {
  it('lists the three projects, collapsed, with no repository link yet', () => {
    render(<ProjectsShowcase />)
    for (const { id } of AI_PROJECTS) expect(card(id)).toHaveAttribute('aria-expanded', 'false')
    expect(repoLink()).not.toBeInTheDocument()
  })

  it.each(AI_PROJECTS.map((project) => [project.id, project.repo] as const))(
    'opens %s: it explains what it is about and links to its repository',
    async (id, repo) => {
      render(<ProjectsShowcase />)
      await userEvent.click(card(id))

      expect(card(id)).toHaveAttribute('aria-expanded', 'true')
      const region = screen.getByRole('region', { name: name(id) })
      expect(within(region).getByText(i18n.t(`agentsOffice.world.projects.items.${id}.summary`))).toBeInTheDocument()
      const link = within(region).getByRole('link', { name: new RegExp(i18n.t('agentsOffice.world.projects.repoCta')) })
      expect(link).toHaveAttribute('href', repo)
      // The repository opens in a new tab, and that tab must not get a handle on this one.
      expect(link).toHaveAttribute('target', '_blank')
      expect(link.getAttribute('rel')).toContain('noopener')
    },
  )

  it('also links El Rincón del Hincha to its live site, and only that one', async () => {
    render(<ProjectsShowcase />)
    const webCta = new RegExp(i18n.t('agentsOffice.world.projects.webCta'))

    await userEvent.click(card('hincha'))
    const link = screen.getByRole('link', { name: webCta })
    expect(link).toHaveAttribute('href', 'https://el-rincon-del-hincha.vercel.app/')
    expect(link).toHaveAttribute('target', '_blank')
    expect(link.getAttribute('rel')).toContain('noopener')
    expect(repoLink()).toBeInTheDocument()

    await userEvent.click(card('portfolio'))
    expect(await screen.findByRole('region', { name: name('portfolio') })).toBeInTheDocument()
    // The Hincha card is still closing: wait for its exit animation to end.
    await waitFor(() => expect(screen.queryByRole('link', { name: webCta })).not.toBeInTheDocument())
  })

  it('names its portfolio "Mi portfolio", not "Este portfolio"', () => {
    render(<ProjectsShowcase />)
    expect(screen.getByRole('button', { name: /Mi portfolio/ })).toBeInTheDocument()
  })

  it('shows the tags of each project, so the AI automation and agentic focus is visible at a glance', () => {
    render(<ProjectsShowcase />)
    expect(screen.getAllByText('IA agéntica').length).toBeGreaterThanOrEqual(2)
    expect(screen.getByText('Evaluaciones automáticas')).toBeInTheDocument()
  })

  it('keeps one project open at a time, and closes it when tapped again', async () => {
    render(<ProjectsShowcase />)
    await userEvent.click(card('portfolio'))
    await userEvent.click(card('rag'))
    expect(card('portfolio')).toHaveAttribute('aria-expanded', 'false')
    expect(card('rag')).toHaveAttribute('aria-expanded', 'true')

    await userEvent.click(card('rag'))
    expect(card('rag')).toHaveAttribute('aria-expanded', 'false')
  })

  it('shows the honest limits of the RAG assistant, and only there', async () => {
    render(<ProjectsShowcase />)
    const limits = i18n.t('agentsOffice.world.projects.limitsLabel')

    await userEvent.click(card('rag'))
    expect(screen.getByRole('heading', { name: limits })).toBeInTheDocument()

    await userEvent.click(card('hincha'))
    await waitFor(() => expect(screen.queryByRole('heading', { name: limits })).not.toBeInTheDocument())
  })

  it('follows the active language', async () => {
    await act(() => i18n.changeLanguage('en'))
    render(<ProjectsShowcase />)
    expect(screen.getByRole('button', { name: /EU AI Act RAG Assistant/ })).toBeInTheDocument()
  })
})
