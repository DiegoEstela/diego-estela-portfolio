import { useEffect, useId, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion'
import { X } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { AgentCard } from './AgentCard'
import { OfficeScene } from './OfficeScene'
import { AGENT_IDS, type AgentId } from './sprites'
import { useSpotlight } from './useSpotlight'

const FOCUSABLE = 'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'

interface AgentsOfficeModalProps {
  open: boolean
  onClose: () => void
}

export function AgentsOfficeModal({ open, onClose }: AgentsOfficeModalProps) {
  const { t } = useTranslation()
  const reduceMotion = useReducedMotion()
  const titleId = useId()
  const subtitleId = useId()
  const dialogRef = useRef<HTMLDivElement>(null)
  const closeRef = useRef<HTMLButtonElement>(null)
  const onCloseRef = useRef(onClose)
  const [selectedId, setSelectedId] = useState<AgentId | null>(null)

  useEffect(() => {
    onCloseRef.current = onClose
  })

  // While open: lock the page scroll, move the focus in, and put everything back on close.
  useEffect(() => {
    if (!open) return
    const trigger = document.activeElement instanceof HTMLElement ? document.activeElement : null
    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    closeRef.current?.focus()

    function onKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        onCloseRef.current()
        return
      }
      if (event.key !== 'Tab' || !dialogRef.current) return

      // Keep Tab inside the dialog, wrapping at both ends.
      const focusables = Array.from(dialogRef.current.querySelectorAll<HTMLElement>(FOCUSABLE))
      if (focusables.length === 0) {
        event.preventDefault()
        return
      }
      const first = focusables[0]
      const last = focusables[focusables.length - 1]
      const active = document.activeElement
      const inside = dialogRef.current.contains(active)
      if (event.shiftKey && (!inside || active === first)) {
        event.preventDefault()
        last.focus()
      } else if (!event.shiftKey && (!inside || active === last)) {
        event.preventDefault()
        first.focus()
      }
    }

    document.addEventListener('keydown', onKeyDown)
    return () => {
      document.removeEventListener('keydown', onKeyDown)
      document.body.style.overflow = previousOverflow
      trigger?.focus()
    }
  }, [open])

  // One bubble at a time keeps a phone screen readable. A picked character keeps it; reduced
  // motion turns the rotation off entirely.
  const { activeId, round } = useSpotlight(AGENT_IDS, { enabled: open && !reduceMotion, pinnedId: selectedId })
  const activities = activeId ? (t(`agentsOffice.agents.${activeId}.doing`, { returnObjects: true }) as unknown) : null
  const bubble =
    activeId && Array.isArray(activities) && activities.length > 0
      ? { id: activeId, text: String(activities[round % activities.length]) }
      : null

  const agents = AGENT_IDS.map((id) => ({ id, label: t(`agentsOffice.agents.${id}.name`) }))
  const duration = reduceMotion ? 0 : 0.2

  // Drawn on document.body: an ancestor with a transform (like the hero buttons) would break `fixed`.
  return createPortal(
    <AnimatePresence>
      {open && (
        <motion.div
          key="agents-office"
          className="fixed inset-0 z-[70] flex items-stretch justify-center sm:items-center sm:p-6"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration }}
        >
          <div
            data-testid="agents-office-backdrop"
            aria-hidden="true"
            className="absolute inset-0"
            style={{ background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(4px)' }}
            onClick={onClose}
          />

          <motion.div
            ref={dialogRef}
            role="dialog"
            aria-modal="true"
            aria-labelledby={titleId}
            aria-describedby={subtitleId}
            className="relative flex h-full w-full flex-col overflow-y-auto sm:h-auto sm:max-h-[92vh] sm:max-w-4xl sm:rounded-3xl"
            style={{
              background: 'var(--bg-primary)',
              border: '1px solid var(--border)',
              boxShadow: '0 0 60px rgba(74,159,217,0.2), 0 24px 48px rgba(0,0,0,0.4)',
            }}
            initial={{ opacity: 0, y: reduceMotion ? 0 : 24, scale: reduceMotion ? 1 : 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: reduceMotion ? 0 : 16, scale: reduceMotion ? 1 : 0.98 }}
            transition={{ duration, ease: 'easeOut' }}
          >
            <header className="flex items-start justify-between gap-4 p-4 sm:p-6 sm:pb-2">
              <div>
                <h2 id={titleId} className="text-xl font-bold sm:text-2xl" style={{ color: 'var(--text-primary)' }}>
                  {t('agentsOffice.title')}
                </h2>
                <p id={subtitleId} className="mt-1 text-sm" style={{ color: 'var(--text-secondary)' }}>
                  {t('agentsOffice.subtitle')}
                </p>
              </div>
              <button
                ref={closeRef}
                type="button"
                onClick={onClose}
                aria-label={t('agentsOffice.close')}
                className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl transition-opacity hover:opacity-70 focus-visible:outline-2 focus-visible:outline-offset-2"
                style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', color: 'var(--text-primary)', outlineColor: 'var(--accent)' }}
              >
                <X size={20} aria-hidden="true" />
              </button>
            </header>

            <div className="grid gap-4 p-4 sm:p-6 lg:grid-cols-[minmax(0,3fr)_minmax(0,2fr)] lg:items-start">
              <div className="overflow-hidden rounded-2xl" style={{ border: '1px solid var(--border)' }}>
                <OfficeScene
                  agents={agents}
                  description={t('agentsOffice.sceneDescription')}
                  selectedId={selectedId}
                  activeId={activeId}
                  bubble={bubble}
                  onSelect={setSelectedId}
                />
              </div>
              <AgentCard selectedId={selectedId} />
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>,
    document.body,
  )
}
