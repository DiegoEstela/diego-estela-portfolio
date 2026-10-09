import { describe, expect, it } from 'vitest'
import { render, screen } from '@testing-library/react'
import i18n from '@/i18n'
import { Hero } from './Hero'

describe('Hero call to actions', () => {
  it('offers projects, the CV and the AI office, side by side', () => {
    render(<Hero />)
    expect(screen.getByRole('button', { name: i18n.t('hero.cta_projects') })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: new RegExp(i18n.t('hero.cta_cv')) })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: i18n.t('agentsOffice.cta') })).toBeInTheDocument()
  })

  it('lets three buttons wrap instead of overflowing between 640 and 768px', () => {
    const { container } = render(<Hero />)
    const row = screen.getByRole('button', { name: i18n.t('agentsOffice.cta') }).closest('div.flex')
    expect(row).not.toBeNull()
    expect(row!.className).toContain('sm:flex-wrap')
    expect(container.querySelector('#hero')).not.toBeNull()
  })
})
