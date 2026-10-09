import { Suspense, lazy, useState } from 'react'
import { Bot } from 'lucide-react'
import { useTranslation } from 'react-i18next'

const loadModal = () => import('./AgentsOfficeModal')
const AgentsOfficeModal = lazy(() => loadModal().then((module) => ({ default: module.AgentsOfficeModal })))

/**
 * Hero button that opens the agents office. The office (sprites, scene, modal) is a separate
 * chunk: it is fetched when the visitor shows interest, never with the first page load.
 */
export function AgentsOffice() {
  const { t } = useTranslation()
  const [open, setOpen] = useState(false)
  // Once opened, the modal stays mounted so it can play its closing animation and keep its state.
  const [everOpened, setEverOpened] = useState(false)

  const show = () => {
    setEverOpened(true)
    setOpen(true)
  }

  return (
    <>
      <button
        type="button"
        onClick={show}
        // Hover (a touch also fires pointerenter) and keyboard focus start the download before the click.
        onPointerEnter={() => void loadModal()}
        onFocus={() => void loadModal()}
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
        <Suspense fallback={null}>
          <AgentsOfficeModal open={open} onClose={() => setOpen(false)} />
        </Suspense>
      )}
    </>
  )
}
