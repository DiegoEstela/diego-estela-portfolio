import { useEffect, useId, useRef, useState, type RefObject } from 'react'
import { createPortal } from 'react-dom'
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion'
import { Coffee, X } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { AgentCard } from './AgentCard'
import { deriveMode, otherMode, resolveMode, type OfficeMode } from './officeMode'
import { OfficeScene } from './OfficeScene'
import { PlanCard } from './PlanCard'
import { latestPlan, loadPlans, progress, type Plan } from './plans'
import { AGENT_IDS, type AgentId } from './sprites'
import { useSpotlight } from './useSpotlight'

// Read once, when the module loads: the plans cannot change while the page is open.
const REAL_PLAN = latestPlan(loadPlans())

const FOCUSABLE = 'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'

interface AgentsOfficeModalProps {
  open: boolean
  onClose: () => void
  /** Where the focus goes on close. The lazy chunk may load after the visitor moved the focus. */
  returnFocusTo?: RefObject<HTMLElement | null>
  /** The plan the board shows. Defaults to the latest plan of the repository; tests inject their own. */
  plan?: Plan | null
}

/**
 * The scene and the card. It only exists while the dialog does, so every opening starts from
 * scratch: the first character in the spotlight and nothing selected.
 */
function OfficeBody({ active, plan }: { active: boolean; plan: Plan | null }) {
  const { t } = useTranslation()
  const reduceMotion = useReducedMotion()
  const [selection, setSelection] = useState<AgentId | 'board' | null>(null)
  // What the visitor chose with the toggle. Null means "whatever the plan says".
  const [override, setOverride] = useState<OfficeMode | null>(null)

  const derived = deriveMode(plan)
  const mode = resolveMode(derived, override)
  const selectedAgent = selection === 'board' ? null : selection

  // One bubble at a time keeps a phone screen readable. A picked character keeps it; reduced
  // motion turns the rotation off entirely. The board is not a character and does not pin it.
  const { activeId, round } = useSpotlight(AGENT_IDS, { enabled: active && !reduceMotion, pinnedId: selectedAgent })
  const lines = mode === 'resting' ? 'resting' : 'doing'
  const activities = activeId ? (t(`agentsOffice.agents.${activeId}.${lines}`, { returnObjects: true }) as unknown) : null
  const bubble =
    activeId && Array.isArray(activities) && activities.length > 0
      ? { id: activeId, text: String(activities[round % activities.length]) }
      : null

  const agents = AGENT_IDS.map((id) => ({ id, label: t(`agentsOffice.agents.${id}.name`) }))
  const { done, total } = plan ? progress(plan) : { done: 0, total: 0 }
  const boardLabel = plan ? t('agentsOffice.plan.boardLabel', { done, total }) : t('agentsOffice.plan.boardLabelEmpty')
  const state = t(`agentsOffice.mode.${mode}`)

  // Picking what the plan already says hands control back to the plan.
  const toggleMode = () => {
    const next = otherMode(mode)
    setOverride(next === derived ? null : next)
  }

  return (
    <div className="grid gap-4 p-4 sm:p-6 lg:grid-cols-[minmax(0,3fr)_minmax(0,2fr)] lg:items-start">
      <div className="flex flex-col gap-3">
        <div className="overflow-hidden rounded-2xl" style={{ border: '1px solid var(--border)' }}>
          <OfficeScene
            agents={agents}
            description={t('agentsOffice.sceneDescription')}
            selectedId={selection}
            activeId={activeId}
            bubble={bubble}
            onSelect={setSelection}
            mode={mode}
            plan={plan}
            boardLabel={boardLabel}
          />
        </div>
        <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
          <button
            type="button"
            aria-pressed={mode === 'resting'}
            onClick={toggleMode}
            className="inline-flex min-h-11 items-center gap-2 rounded-xl px-4 text-sm font-medium transition-opacity hover:opacity-80 focus-visible:outline-2 focus-visible:outline-offset-2"
            style={{
              background: mode === 'resting' ? 'var(--accent)' : 'var(--bg-card)',
              border: '1px solid var(--border)',
              color: mode === 'resting' ? 'var(--bg-primary)' : 'var(--text-primary)',
              outlineColor: 'var(--accent)',
            }}
          >
            <Coffee size={16} aria-hidden="true" />
            {t('agentsOffice.mode.toggle')}
          </button>
          <p role="status" className="text-xs" style={{ color: 'var(--text-secondary)' }}>
            {override === null ? t('agentsOffice.mode.fromPlan', { state }) : t('agentsOffice.mode.manual', { state })}
          </p>
        </div>
      </div>
      {selection === 'board' ? <PlanCard plan={plan} /> : <AgentCard selectedId={selectedAgent} />}
    </div>
  )
}

export function AgentsOfficeModal({ open, onClose, returnFocusTo, plan }: AgentsOfficeModalProps) {
  const { t } = useTranslation()
  const reduceMotion = useReducedMotion()
  const titleId = useId()
  const subtitleId = useId()
  const dialogRef = useRef<HTMLDivElement>(null)
  const closeRef = useRef<HTMLButtonElement>(null)
  const onCloseRef = useRef(onClose)

  useEffect(() => {
    onCloseRef.current = onClose
  })

  // While open: lock the page scroll, move the focus in, and put everything back on close.
  useEffect(() => {
    if (!open) return
    const trigger = returnFocusTo?.current ?? (document.activeElement instanceof HTMLElement ? document.activeElement : null)
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
  }, [open, returnFocusTo])

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
            className="relative flex h-full w-full flex-col overflow-y-auto overscroll-contain sm:h-auto sm:max-h-[92vh] sm:max-w-4xl sm:rounded-3xl"
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

            <OfficeBody active={open} plan={plan === undefined ? REAL_PLAN : plan} />
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>,
    document.body,
  )
}
