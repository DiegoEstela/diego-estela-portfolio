import { afterEach, describe, expect, it } from 'vitest'
import { act, render, screen, within } from '@testing-library/react'
import i18n from '@/i18n'
import { CERTIFICATIONS, certificationStatus } from './certifications'
import { CertificationsShowcase } from './CertificationsShowcase'

const cert = (id: string) => CERTIFICATIONS.find((c) => c.id === id)!
const name = (id: string) => i18n.t(`agentsOffice.world.certs.items.${id}.name`)
const card = (id: string) => screen.getByRole('heading', { level: 3, name: name(id) }).closest('li')!

afterEach(async () => {
  await act(() => i18n.changeLanguage('es'))
})

describe('certificationStatus', () => {
  it('is done for a certificate that was already issued', () => {
    expect(certificationStatus(cert('udemy'), new Date('2026-10-22'))).toBe('done')
    expect(certificationStatus(cert('claude'), new Date('2026-10-22'))).toBe('done')
  })

  it('is in progress until the last day of a training has passed', () => {
    expect(certificationStatus(cert('security'), new Date('2026-10-22T10:00:00'))).toBe('inProgress')
    expect(certificationStatus(cert('security'), new Date('2026-10-27T19:00:00'))).toBe('inProgress')
  })

  it('is only finished afterwards, never "done" while there is no certificate to show', () => {
    expect(certificationStatus(cert('security'), new Date('2026-10-28T09:00:00'))).toBe('finished')
  })
})

describe('Certifications', () => {
  it('lists the three trainings', () => {
    render(<CertificationsShowcase />)
    expect(screen.getAllByRole('heading', { level: 3 })).toHaveLength(3)
    for (const { id } of CERTIFICATIONS) expect(screen.getByRole('heading', { level: 3, name: name(id) })).toBeInTheDocument()
  })

  it('shows the diploma of Udemy and DEXS, each opening the full image in a new tab', () => {
    render(<CertificationsShowcase />)
    for (const id of ['udemy', 'claude']) {
      const image = within(card(id)).getByRole('img', { name: new RegExp(name(id).replace(/[.*+?^${}()|[\]\\]/g, '\\$&')) })
      const link = image.closest('a')!
      expect(link).toHaveAttribute('href', cert(id).image)
      expect(link).toHaveAttribute('target', '_blank')
      expect(link.getAttribute('rel')).toContain('noopener')
    }
  })

  it('links the Udemy credential to its public verification page and shows its ID', () => {
    render(<CertificationsShowcase />)
    const udemy = within(card('udemy'))
    const link = udemy.getByRole('link', { name: new RegExp(i18n.t('agentsOffice.world.certs.verify')) })
    expect(link).toHaveAttribute('href', 'https://ude.my/UC-3f436f5d-672b-46a6-baac-027daa61758a')
    expect(udemy.getByText('UC-3f436f5d-672b-46a6-baac-027daa61758a')).toBeInTheDocument()
  })

  it('does not pretend the security training has a certificate: no image, no verification link', () => {
    render(<CertificationsShowcase />)
    const security = within(card('security'))
    expect(security.queryByRole('img')).not.toBeInTheDocument()
    expect(security.queryByRole('link')).not.toBeInTheDocument()
    expect(security.getByText(i18n.t('agentsOffice.world.certs.noImage'))).toBeInTheDocument()
  })

  it('names the issuer of the Claude Code diploma', () => {
    render(<CertificationsShowcase />)
    expect(within(card('claude')).getByText(/DEXS/)).toBeInTheDocument()
  })

  it('follows the active language', async () => {
    await act(() => i18n.changeLanguage('en'))
    render(<CertificationsShowcase />)
    expect(screen.getByRole('heading', { level: 3, name: 'Claude Code for software development' })).toBeInTheDocument()
  })
})
