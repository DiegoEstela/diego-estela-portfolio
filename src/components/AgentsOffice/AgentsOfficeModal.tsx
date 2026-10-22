import { useEffect, useId, useRef, useState, type RefObject } from 'react'
import { createPortal } from 'react-dom'
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion'
import { Award, Bot, Coffee, Cpu, FolderGit2 } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { AgentCard } from './AgentCard'
import { deriveMode, otherMode, resolveMode, type OfficeMode } from './officeMode'
import { OfficeScene } from './OfficeScene'
import { PlanCard } from './PlanCard'
import { CertificationsShowcase } from './CertificationsShowcase'
import { ProjectsShowcase } from './ProjectsShowcase'
import { WorldBoot } from './WorldBoot'
import { WorldNav, type WorldNavItem } from './WorldNav'
import { progress, type Plan } from './planParser'
import { LATEST_PLAN } from './plans'
import { AGENT_IDS, type AgentId } from './sprites'
import { useSpotlight } from './useSpotlight'

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
        {/* One short line for screen readers, in a region that is always mounted and only changes its
            text: some screen readers ignore a live region that is created already holding its content,
            and the cards below come and go. */}
        <p role="status" className="sr-only">
          {selection === 'board'
            ? t('agentsOffice.plan.selected')
            : selection !== null
              ? t('agentsOffice.selected', { name: t(`agentsOffice.agents.${selection}.name`) })
              : ''}
        </p>
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
  const [menuOpen, setMenuOpen] = useState(false)
  const menuOpenRef = useRef(false)
  const [activeSection, setActiveSection] = useState('projects')

  useEffect(() => {
    onCloseRef.current = onClose
    menuOpenRef.current = menuOpen
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
        // The phone menu is a layer of its own: Escape closes it before it closes the world.
        if (menuOpenRef.current) setMenuOpen(false)
        else onCloseRef.current()
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
  const projectsRef = useRef<HTMLElement>(null)
  const certsRef = useRef<HTMLElement>(null)
  const officeRef = useRef<HTMLElement>(null)
  const goTo = (target: RefObject<HTMLElement | null>) =>
    target.current?.scrollIntoView({ block: 'start', behavior: reduceMotion ? 'auto' : 'smooth' })

  const sections: (WorldNavItem & { ref: RefObject<HTMLElement | null> })[] = [
    { id: 'projects', label: t('agentsOffice.world.navProjects'), icon: FolderGit2, ref: projectsRef, onSelect: () => goTo(projectsRef) },
    { id: 'certs', label: t('agentsOffice.world.navCerts'), icon: Award, ref: certsRef, onSelect: () => goTo(certsRef) },
    { id: 'office', label: t('agentsOffice.world.navOffice'), icon: Bot, ref: officeRef, onSelect: () => goTo(officeRef) },
  ]

  // The section in the upper part of the screen is the one the visitor is reading.
  const trackSection = () => {
    const line = window.innerHeight * 0.35
    const current = [...sections].reverse().find(({ ref }) => (ref.current?.getBoundingClientRect().top ?? Infinity) <= line)
    setActiveSection(current?.id ?? sections[0].id)
  }

  // Drawn on document.body: an ancestor with a transform (like the hero buttons) would break `fixed`.
  return createPortal(
    <AnimatePresence>
      {open && (
        <motion.div
          key="agents-office"
          className="ai-world fixed inset-0 z-[70]"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration }}
        >
          {/* A whole page of its own, not a small window: the blueprint grid and the scanner line
              are what make it feel like another place. */}
          <div aria-hidden="true" className="world-sky absolute inset-0">
            <div className="world-scan" />
          </div>

          <motion.div
            ref={dialogRef}
            role="dialog"
            aria-modal="true"
            aria-labelledby={titleId}
            aria-describedby={subtitleId}
            onScroll={trackSection}
            className="relative flex h-full w-full flex-col overflow-y-auto overscroll-contain"
            style={{ color: 'var(--text-primary)' }}
            initial={{ opacity: 0, scale: reduceMotion ? 1 : 1.05 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: reduceMotion ? 1 : 0.97 }}
            transition={{ duration: reduceMotion ? 0 : 0.6, ease: 'easeOut' }}
          >
            <WorldNav
              backRef={closeRef}
              onBack={onClose}
              items={sections}
              activeId={activeSection}
              menuOpen={menuOpen}
              onMenuOpenChange={setMenuOpen}
            />

            <div className="mx-auto w-full max-w-5xl px-4 pb-16 pt-16 sm:px-6 md:pt-20">
              <div className="py-8 text-center sm:py-12">
                <Cpu size={32} aria-hidden="true" className="world-float mx-auto mb-4" style={{ color: 'var(--accent)' }} />
                <h2 id={titleId} className="world-title text-4xl font-extrabold sm:text-6xl">
                  {t('agentsOffice.title')}
                </h2>
                <p id={subtitleId} className="mx-auto mt-4 max-w-2xl text-base sm:text-lg" style={{ color: 'var(--text-secondary)' }}>
                  {t('agentsOffice.subtitle')}
                </p>
              </div>

              <section ref={projectsRef} aria-labelledby={`${titleId}-projects`} className="scroll-mt-24">
                <h2 id={`${titleId}-projects`} className="world-heading text-2xl font-bold sm:text-3xl">
                  {t('agentsOffice.world.projects.title')}
                </h2>
                <p className="mb-5 mt-1 text-sm" style={{ color: 'var(--text-secondary)' }}>
                  {t('agentsOffice.world.projects.subtitle')}
                </p>
                <ProjectsShowcase />
              </section>

              <section ref={certsRef} aria-labelledby={`${titleId}-certs`} className="mt-16 scroll-mt-24">
                <h2 id={`${titleId}-certs`} className="world-heading text-2xl font-bold sm:text-3xl">
                  {t('agentsOffice.world.certs.title')}
                </h2>
                <p className="mb-5 mt-1 text-sm" style={{ color: 'var(--text-secondary)' }}>
                  {t('agentsOffice.world.certs.subtitle')}
                </p>
                <CertificationsShowcase />
              </section>

              <section ref={officeRef} aria-labelledby={`${titleId}-office`} className="mt-16 scroll-mt-24">
                <h2 id={`${titleId}-office`} className="world-heading text-2xl font-bold sm:text-3xl">
                  {t('agentsOffice.world.office.title')}
                </h2>
                <p className="mt-1 text-sm" style={{ color: 'var(--text-secondary)' }}>
                  {t('agentsOffice.world.office.subtitle')}
                </p>
                <div className="-mx-4 sm:-mx-6">
                  <OfficeBody active={open} plan={plan === undefined ? LATEST_PLAN : plan} />
                </div>
              </section>
            </div>
          </motion.div>

          <WorldBoot skip={Boolean(reduceMotion)} />
        </motion.div>
      )}
    </AnimatePresence>,
    document.body,
  )
}
