import type { ComponentType, RefObject } from 'react'
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion'
import { ArrowLeft, Menu, X } from 'lucide-react'
import { useTranslation } from 'react-i18next'

export interface WorldNavItem {
  id: string
  label: string
  icon: ComponentType<{ size?: number; 'aria-hidden'?: boolean | 'true' | 'false' }>
  onSelect: () => void
}

interface WorldNavProps {
  backRef: RefObject<HTMLButtonElement | null>
  onBack: () => void
  items: WorldNavItem[]
  activeId: string
  menuOpen: boolean
  onMenuOpenChange: (open: boolean) => void
}

/**
 * The navigation of the AI world. It sticks to the top while the page scrolls: on a phone, an icon-only
 * "back" button on the left and the sections behind a menu button at the top right (phone, like the
 * menu of the portfolio), or a bar of labelled buttons floating at the top centre (tablet and up).
 * It takes no height, so the page flows under it.
 */
export function WorldNav({ backRef, onBack, items, activeId, menuOpen, onMenuOpenChange }: WorldNavProps) {
  const { t } = useTranslation()
  const reduceMotion = useReducedMotion()
  const menuId = 'world-menu'

  const select = (item: WorldNavItem) => {
    onMenuOpenChange(false)
    item.onSelect()
  }

  const link = (item: WorldNavItem) => (
    <li key={item.id}>
      <button
        type="button"
        onClick={() => select(item)}
        aria-current={activeId === item.id ? 'true' : undefined}
        className="world-nav-link"
      >
        <item.icon size={18} aria-hidden="true" />
        {item.label}
      </button>
    </li>
  )

  return (
    <div className="sticky top-0 z-30 h-0">
      <div className="world-rail">
        <button
          ref={backRef}
          type="button"
          onClick={onBack}
          aria-label={t('agentsOffice.close')}
          title={t('agentsOffice.close')}
          className="world-icon-btn world-icon-btn--back"
        >
          <ArrowLeft size={20} aria-hidden="true" />
          <span className="world-back-label">{t('agentsOffice.close')}</span>
        </button>

        <nav aria-label={t('agentsOffice.world.nav')} className="hidden md:block">
          <ul className="flex gap-0.5">{items.map(link)}</ul>
        </nav>
      </div>

      {/* On a phone the menu sits at the top right, where the menu of the portfolio is. */}
      <div className="absolute right-0 top-0 flex flex-col items-end gap-2 p-3 md:hidden">
        <button
          type="button"
          onClick={() => onMenuOpenChange(!menuOpen)}
          aria-expanded={menuOpen}
          aria-controls={menuId}
          aria-label={t('agentsOffice.world.menu')}
          className="world-icon-btn"
        >
          {menuOpen ? <X size={20} aria-hidden="true" /> : <Menu size={20} aria-hidden="true" />}
        </button>

        <AnimatePresence>
          {menuOpen && (
            <motion.nav
              id={menuId}
              aria-label={t('agentsOffice.world.nav')}
              className="world-menu"
              initial={{ opacity: 0, y: reduceMotion ? 0 : -8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: reduceMotion ? 0 : -8 }}
              transition={{ duration: reduceMotion ? 0 : 0.2 }}
            >
              <ul className="flex flex-col gap-1">{items.map(link)}</ul>
            </motion.nav>
          )}
        </AnimatePresence>
      </div>
    </div>
  )
}
