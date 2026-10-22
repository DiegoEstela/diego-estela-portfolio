import { useCallback, useEffect, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { Cog } from 'lucide-react'
import { useTranslation } from 'react-i18next'

/** How long the machine runs before the world shows. */
export const BOOT_MS = 2200
const LINE_STEP_S = 0.4

/** The loading screen: a little machine that boots before the visitor steps into the world. */
function Machine({ onDone }: { onDone: () => void }) {
  const { t } = useTranslation()
  const lines = t('agentsOffice.world.boot.lines', { returnObjects: true }) as unknown
  const steps = Array.isArray(lines) ? lines.map(String) : []

  useEffect(() => {
    const timer = setTimeout(onDone, BOOT_MS)
    return () => clearTimeout(timer)
  }, [onDone])

  // Any key skips the machine, for a visitor with a keyboard. Escape is left alone: it still goes
  // to the dialog, which closes the world, boot included.
  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if (event.key !== 'Escape') onDone()
    }
    document.addEventListener('keydown', onKeyDown)
    return () => document.removeEventListener('keydown', onKeyDown)
  }, [onDone])

  return (
    <motion.div
      aria-hidden="true"
      data-testid="world-boot"
      onClick={onDone}
      className="absolute inset-0 z-30 flex cursor-pointer flex-col items-center justify-center gap-8 px-6"
      style={{ background: '#070B1A', color: '#BFDBFE' }}
      initial={{ clipPath: 'circle(150% at 50% 50%)' }}
      exit={{ clipPath: 'circle(0% at 50% 50%)', transition: { duration: 0.7, ease: 'easeInOut' } }}
    >
      <div className="world-boot-grid absolute inset-0" />

      <div className="relative flex items-end gap-1" style={{ color: '#60A5FA' }}>
        <Cog size={72} className="world-cog" />
        <Cog size={44} className="world-cog world-cog--reverse mb-2" style={{ color: '#38BDF8' }} />
        <Cog size={28} className="world-cog mb-10" />
      </div>

      <p className="relative text-2xl font-bold tracking-[0.4em]" style={{ fontFamily: "'Space Grotesk', sans-serif", color: '#F1F5F9' }}>
        {t('agentsOffice.world.boot.title')}
      </p>

      <ul className="relative w-[min(88vw,22rem)] space-y-1 font-mono text-sm">
        {steps.map((line, index) => (
          <motion.li
            key={line}
            initial={{ opacity: 0, x: -8 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: index * LINE_STEP_S, duration: 0.2 }}
          >
            <span style={{ color: '#38BDF8' }}>{'> '}</span>
            {line}
          </motion.li>
        ))}
      </ul>

      <div className="relative h-2 w-[min(88vw,22rem)] overflow-hidden rounded-full" style={{ background: 'rgba(96,165,250,0.2)' }}>
        <motion.div
          className="h-full rounded-full"
          style={{ background: '#38BDF8' }}
          initial={{ width: '0%' }}
          animate={{ width: '100%' }}
          transition={{ duration: BOOT_MS / 1000, ease: 'linear' }}
        />
      </div>

      <p className="relative text-xs" style={{ color: '#94A3B8' }}>
        {t('agentsOffice.world.boot.skip')}
      </p>
    </motion.div>
  )
}

/**
 * Covers the world while the machine boots. The world is already mounted underneath, so nothing
 * waits for the animation. With reduced motion there is no boot at all.
 */
export function WorldBoot({ skip }: { skip: boolean }) {
  const [booting, setBooting] = useState(!skip)
  // Stable, so the timer of the machine is not restarted every time the world re-renders.
  const finish = useCallback(() => setBooting(false), [])
  return <AnimatePresence>{booting && <Machine onDone={finish} />}</AnimatePresence>
}
