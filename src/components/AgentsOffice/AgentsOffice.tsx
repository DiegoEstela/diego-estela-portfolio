import { Component, Suspense, lazy, useEffect, useRef, useState, type ReactNode } from 'react'
import { createPortal } from 'react-dom'
import { Bot } from 'lucide-react'
import { useTranslation } from 'react-i18next'

const loadModal = () => import('./AgentsOfficeModal')
const makeLazyModal = () => lazy(() => loadModal().then((module) => ({ default: module.AgentsOfficeModal })))

// Warms the chunk in the background. A failure here is harmless: the click will report it.
const preload = () => {
  loadModal().catch(() => {})
}

/** Catches a failed chunk download, so it cannot unmount the whole app. */
class LoadBoundary extends Component<{ onFail: () => void; fallback: ReactNode; children: ReactNode }, { failed: boolean }> {
  state = { failed: false }

  static getDerivedStateFromError() {
    return { failed: true }
  }

  componentDidCatch() {
    this.props.onFail()
  }

  render() {
    return this.state.failed ? this.props.fallback : this.props.children
  }
}

const toast = {
  background: 'var(--bg-card)',
  border: '1px solid var(--border)',
  color: 'var(--text-primary)',
  boxShadow: '0 8px 24px rgba(0,0,0,0.35)',
} as const

/** Not blocking on purpose: if the network hangs, it must not cover the site. */
function Loading() {
  const { t } = useTranslation()
  return createPortal(
    <div role="status" className="pointer-events-none fixed bottom-6 left-1/2 z-[70] -translate-x-1/2">
      <p className="flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-medium" style={toast}>
        <Bot size={16} aria-hidden="true" className="motion-safe:animate-pulse" style={{ color: 'var(--accent)' }} />
        {t('agentsOffice.loading')}
      </p>
    </div>,
    document.body,
  )
}

function LoadError() {
  const { t } = useTranslation()
  const [visible, setVisible] = useState(true)

  useEffect(() => {
    const timer = setTimeout(() => setVisible(false), 8000)
    return () => clearTimeout(timer)
  }, [])

  if (!visible) return null
  return createPortal(
    <div role="alert" className="fixed bottom-6 left-1/2 z-[70] w-[min(92vw,26rem)] -translate-x-1/2 rounded-xl px-4 py-3 text-sm" style={toast}>
      {t('agentsOffice.loadError')}
    </div>,
    document.body,
  )
}

/**
 * Hero button that opens the agents office. The office (sprites, scene, modal) is a separate
 * chunk: it is fetched when the visitor shows interest, never with the first page load.
 */
export function AgentsOffice() {
  const { t } = useTranslation()
  const buttonRef = useRef<HTMLButtonElement>(null)
  const [Modal, setModal] = useState(makeLazyModal)
  const [attempt, setAttempt] = useState(0)
  const [failed, setFailed] = useState(false)
  const [open, setOpen] = useState(false)
  // Once opened, the modal stays mounted so it can play its closing animation.
  const [everOpened, setEverOpened] = useState(false)

  const show = () => {
    if (failed) {
      // A rejected lazy component stays rejected: a retry needs a new one.
      setModal(makeLazyModal)
      setAttempt((current) => current + 1)
      setFailed(false)
    }
    setEverOpened(true)
    setOpen(true)
  }

  return (
    <>
      <button
        ref={buttonRef}
        type="button"
        onClick={show}
        // Hover (a touch also fires pointerenter) and keyboard focus start the download before the click.
        onPointerEnter={preload}
        onFocus={preload}
        aria-haspopup="dialog"
        className="agents-cta flex w-64 items-center justify-center gap-2 rounded-xl border px-8 py-3.5 font-semibold transition-all duration-300 hover:scale-105 sm:w-auto"
        style={{
          borderColor: 'var(--accent)',
          color: 'var(--accent)',
          background: 'linear-gradient(135deg, var(--glow), transparent 70%)',
        }}
      >
        <Bot size={18} aria-hidden="true" className="shrink-0" />
        {/* Same width as the other two buttons on a phone, so the question may wrap: keep it tight. */}
        <span className="text-left leading-snug">{t('agentsOffice.cta')}</span>
      </button>

      {everOpened && (
        <LoadBoundary
          key={attempt}
          onFail={() => {
            setFailed(true)
            setOpen(false)
          }}
          fallback={<LoadError />}
        >
          <Suspense fallback={<Loading />}>
            <Modal open={open} onClose={() => setOpen(false)} returnFocusTo={buttonRef} />
          </Suspense>
        </LoadBoundary>
      )}
    </>
  )
}
