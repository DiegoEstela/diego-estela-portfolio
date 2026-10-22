import { useState } from 'react'
import { describe, expect, it, vi } from 'vitest'
import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { Award, FolderGit2 } from 'lucide-react'
import i18n from '@/i18n'
import { WorldNav, type WorldNavItem } from './WorldNav'

const menuLabel = () => i18n.t('agentsOffice.world.menu')
const backLabel = () => i18n.t('agentsOffice.close')

function Harness({ onBack = () => {}, onSelect = () => {}, activeId = 'projects' }: { onBack?: () => void; onSelect?: (id: string) => void; activeId?: string }) {
  const [menuOpen, setMenuOpen] = useState(false)
  const items: WorldNavItem[] = [
    { id: 'projects', label: 'Proyectos', icon: FolderGit2, onSelect: () => onSelect('projects') },
    { id: 'certs', label: 'Certificaciones', icon: Award, onSelect: () => onSelect('certs') },
  ]
  return <WorldNav backRef={{ current: null }} onBack={onBack} items={items} activeId={activeId} menuOpen={menuOpen} onMenuOpenChange={setMenuOpen} />
}

describe('WorldNav', () => {
  it('has a back button that shows only an icon but is named for assistive technology', async () => {
    const onBack = vi.fn()
    render(<Harness onBack={onBack} />)
    const back = screen.getByRole('button', { name: backLabel() })
    expect(back.textContent).toBe('')
    await userEvent.click(back)
    expect(onBack).toHaveBeenCalledTimes(1)
  })

  it('lists the sections in the side panel, marking the one being read', () => {
    render(<Harness activeId="certs" />)
    const panel = screen.getByRole('navigation', { name: i18n.t('agentsOffice.world.nav') })
    expect(within(panel).getByRole('button', { name: 'Certificaciones' })).toHaveAttribute('aria-current', 'true')
    expect(within(panel).getByRole('button', { name: 'Proyectos' })).not.toHaveAttribute('aria-current')
  })

  it('keeps the phone menu closed until the menu button is pressed, and says so', async () => {
    render(<Harness />)
    const toggle = screen.getByRole('button', { name: menuLabel() })
    expect(toggle).toHaveAttribute('aria-expanded', 'false')
    expect(document.getElementById('world-menu')).toBeNull()

    await userEvent.click(toggle)
    expect(toggle).toHaveAttribute('aria-expanded', 'true')
    expect(document.getElementById('world-menu')).not.toBeNull()
  })

  it('goes to the chosen section and closes the phone menu', async () => {
    const onSelect = vi.fn()
    render(<Harness onSelect={onSelect} />)
    await userEvent.click(screen.getByRole('button', { name: menuLabel() }))
    await userEvent.click(within(document.getElementById('world-menu')!).getByRole('button', { name: 'Certificaciones' }))

    expect(onSelect).toHaveBeenCalledWith('certs')
    expect(screen.getByRole('button', { name: menuLabel() })).toHaveAttribute('aria-expanded', 'false')
  })
})
