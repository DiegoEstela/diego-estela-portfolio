import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { act, render, screen, within } from '@testing-library/react'
import i18n from '@/i18n'
import { PlanCard } from './PlanCard'
import type { Plan } from './plans'

const plan: Plan = {
  issue: 24,
  title: 'Oficina de agentes v2',
  issueUrl: 'https://github.com/o/r/issues/24',
  tasks: [
    { title: 'Lector de planes', done: true },
    { title: 'Estado del descanso', done: true },
    { title: 'Ficha del plan', done: false },
  ],
}

async function useLanguage(lng: 'es' | 'en') {
  await act(() => i18n.changeLanguage(lng))
}

afterEach(() => useLanguage('es'))

describe('PlanCard with a plan', () => {
  it('shows the title of the plan, marked as Spanish because plans are written in Spanish', async () => {
    await useLanguage('en')
    render(<PlanCard plan={plan} />)
    const title = screen.getByRole('heading', { name: 'Oficina de agentes v2' })
    expect(title).toHaveAttribute('lang', 'es')
  })

  it('links to the issue and opens it safely in a new tab', async () => {
    await useLanguage('es')
    render(<PlanCard plan={plan} />)
    const link = screen.getByRole('link', { name: i18n.t('agentsOffice.plan.issueLink', { number: 24 }) })
    expect(link).toHaveAttribute('href', 'https://github.com/o/r/issues/24')
    expect(link).toHaveAttribute('target', '_blank')
    expect(link).toHaveAttribute('rel', expect.stringMatching(/noopener/))
    expect(link).toHaveAttribute('rel', expect.stringMatching(/noreferrer/))
  })

  it('has no link when the plan does not say which issue it belongs to', () => {
    render(<PlanCard plan={{ ...plan, issueUrl: null }} />)
    expect(screen.queryByRole('link')).not.toBeInTheDocument()
  })

  it('shows the progress as a named progress bar with its real values', async () => {
    await useLanguage('es')
    render(<PlanCard plan={plan} />)
    const bar = screen.getByRole('progressbar', { name: i18n.t('agentsOffice.plan.progressLabel') })
    expect(bar).toHaveAttribute('aria-valuemin', '0')
    expect(bar).toHaveAttribute('aria-valuemax', '3')
    expect(bar).toHaveAttribute('aria-valuenow', '2')
    expect(bar).toHaveAttribute('aria-valuetext', i18n.t('agentsOffice.plan.progressText', { done: 2, total: 3 }))
  })

  it('also says the progress in words, so it does not depend on the bar', async () => {
    await useLanguage('es')
    render(<PlanCard plan={plan} />)
    expect(screen.getAllByText(i18n.t('agentsOffice.plan.progressText', { done: 2, total: 3 })).length).toBeGreaterThan(0)
  })

  it('fills the whole bar when every task is done', () => {
    render(<PlanCard plan={{ ...plan, tasks: plan.tasks.map((task) => ({ ...task, done: true })) }} />)
    const bar = screen.getByRole('progressbar')
    expect(bar).toHaveAttribute('aria-valuenow', '3')
    expect(bar).toHaveAttribute('aria-valuemax', '3')
  })

  it('lists every task with its state in words, never only in color', async () => {
    await useLanguage('es')
    render(<PlanCard plan={plan} />)
    const list = screen.getByRole('list', { name: i18n.t('agentsOffice.plan.tasksLabel') })
    const items = within(list).getAllByRole('listitem')
    expect(items).toHaveLength(3)
    expect(items[0]).toHaveTextContent(i18n.t('agentsOffice.plan.done'))
    expect(items[0]).toHaveTextContent('Lector de planes')
    expect(items[2]).toHaveTextContent(i18n.t('agentsOffice.plan.pending'))
    expect(items[2]).not.toHaveTextContent(i18n.t('agentsOffice.plan.done'))
  })

  it('marks the task titles as Spanish, so a screen reader pronounces them properly in English', async () => {
    await useLanguage('en')
    render(<PlanCard plan={plan} />)
    const first = screen.getByText('Lector de planes')
    expect(first.closest('[lang]')).toHaveAttribute('lang', 'es')
  })

  it('says in English that the plans are written in Spanish, and does not say it in Spanish', async () => {
    await useLanguage('en')
    const { unmount } = render(<PlanCard plan={plan} />)
    expect(screen.getByText(i18n.t('agentsOffice.plan.spanishNote'))).toBeInTheDocument()
    unmount()
    await useLanguage('es')
    render(<PlanCard plan={plan} />)
    expect(screen.queryByText(i18n.t('agentsOffice.plan.spanishNote'))).not.toBeInTheDocument()
  })

  it('announces the selection with a short line for screen readers', async () => {
    await useLanguage('es')
    render(<PlanCard plan={plan} />)
    expect(screen.getByRole('status')).toHaveTextContent(i18n.t('agentsOffice.plan.selected'))
  })
})

describe('PlanCard without tasks or plans', () => {
  it('explains that a plan has no tasks yet, without an empty progress bar', async () => {
    await useLanguage('es')
    render(<PlanCard plan={{ ...plan, tasks: [] }} />)
    expect(screen.getByText(i18n.t('agentsOffice.plan.noTasks'))).toBeInTheDocument()
    expect(screen.queryByRole('progressbar')).not.toBeInTheDocument()
  })

  it('explains that there are no plans at all', async () => {
    await useLanguage('es')
    render(<PlanCard plan={null} />)
    expect(screen.getByText(i18n.t('agentsOffice.plan.empty'))).toBeInTheDocument()
    expect(screen.queryByRole('progressbar')).not.toBeInTheDocument()
    expect(screen.queryByRole('heading')).not.toBeInTheDocument()
  })
})

describe('PlanCard scrolling', () => {
  beforeEach(() => vi.mocked(Element.prototype.scrollIntoView).mockClear())

  it('brings itself into view when it appears, because on a phone it sits below the scene', () => {
    const { container } = render(<PlanCard plan={plan} />)
    expect(Element.prototype.scrollIntoView).toHaveBeenCalledTimes(1)
    expect(vi.mocked(Element.prototype.scrollIntoView).mock.contexts[0]).toBe(container.firstElementChild)
  })
})
