import { useId, useState } from 'react'
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion'
import { ChevronDown, ExternalLink, Globe } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { AI_PROJECTS, type AiProject, type AiProjectId } from './aiProjects'

/** Lists the translated strings of a key, or nothing when the key is missing. */
function useList() {
  const { t } = useTranslation()
  return (key: string) => {
    const value = t(key, { returnObjects: true }) as unknown
    return Array.isArray(value) ? value.map(String) : []
  }
}

function Tags({ id }: { id: AiProjectId }) {
  const list = useList()
  return (
    <ul className="mt-3 flex flex-wrap gap-1.5">
      {list(`agentsOffice.world.projects.items.${id}.tags`).map((tag) => (
        <li key={tag} className="world-chip">
          {tag}
        </li>
      ))}
    </ul>
  )
}

function Section({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <h4 className="world-label mb-2">{label}</h4>
      {children}
    </div>
  )
}

const linkClass =
  'inline-flex min-h-11 w-fit items-center gap-2 rounded-xl px-5 text-sm font-semibold transition-transform hover:scale-105 focus-visible:outline-2 focus-visible:outline-offset-2'

function Details({ project }: { project: AiProject }) {
  const { t } = useTranslation()
  const list = useList()
  const { id, repo, web, hasLimits } = project
  const base = `agentsOffice.world.projects.items.${id}`
  const projectName = t(`${base}.name`)

  return (
    <div className="grid gap-5 px-4 pb-6 pt-1 text-sm sm:px-6" style={{ color: 'var(--text-secondary)' }}>
      <Section label={t('agentsOffice.world.projects.whatLabel')}>
        <p className="leading-relaxed">{t(`${base}.summary`)}</p>
      </Section>

      <Section label={t('agentsOffice.world.projects.howLabel')}>
        <ol className="world-steps space-y-2 leading-relaxed">
          {list(`${base}.how`).map((step) => (
            <li key={step}>{step}</li>
          ))}
        </ol>
      </Section>

      <Section label={t('agentsOffice.world.projects.highlightsLabel')}>
        <ul className="list-disc space-y-1 pl-5 leading-relaxed">
          {list(`${base}.highlights`).map((line) => (
            <li key={line}>{line}</li>
          ))}
        </ul>
      </Section>

      {hasLimits && (
        <Section label={t('agentsOffice.world.projects.limitsLabel')}>
          <ul className="list-disc space-y-1 pl-5 leading-relaxed">
            {list(`${base}.limits`).map((line) => (
              <li key={line}>{line}</li>
            ))}
          </ul>
        </Section>
      )}

      <p>
        <span className="font-semibold" style={{ color: 'var(--text-primary)' }}>
          {t('agentsOffice.world.projects.stackLabel')}:
        </span>{' '}
        {t(`${base}.stack`)}
      </p>

      <div className="flex flex-wrap gap-3">
        {web && (
          <a
            href={web}
            target="_blank"
            rel="noopener noreferrer"
            className={`${linkClass} world-cta`}
            style={{ outlineColor: 'var(--accent)' }}
          >
            <Globe size={16} aria-hidden="true" />
            {t('agentsOffice.world.projects.webCta')}
            <span className="sr-only"> — {projectName}</span>
          </a>
        )}
        <a
          href={repo}
          target="_blank"
          rel="noopener noreferrer"
          className={web ? `${linkClass} world-cta-ghost` : `${linkClass} world-cta`}
          style={{ outlineColor: 'var(--accent)' }}
        >
          <ExternalLink size={16} aria-hidden="true" />
          {t('agentsOffice.world.projects.repoCta')}
          <span className="sr-only"> — {projectName}</span>
        </a>
      </div>
    </div>
  )
}

/** The AI projects as cards: tapping one opens what it is about, how the AI works and the links. */
export function ProjectsShowcase() {
  const { t } = useTranslation()
  const reduceMotion = useReducedMotion()
  const baseId = useId()
  const [openId, setOpenId] = useState<AiProjectId | null>(null)

  return (
    <ul className="grid gap-5">
      {AI_PROJECTS.map((project, index) => {
        const { id } = project
        const expanded = openId === id
        const panelId = `${baseId}-${id}`
        return (
          <motion.li
            key={id}
            className="world-card"
            data-expanded={expanded || undefined}
            initial={{ opacity: 0, y: reduceMotion ? 0 : 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: reduceMotion ? 0 : 0.5, delay: reduceMotion ? 0 : 0.15 * index }}
          >
            <h3>
              <button
                type="button"
                aria-expanded={expanded}
                aria-controls={panelId}
                onClick={() => setOpenId(expanded ? null : id)}
                className="flex min-h-11 w-full items-start justify-between gap-4 p-4 text-left sm:p-6 focus-visible:outline-2 focus-visible:-outline-offset-2"
                style={{ outlineColor: 'var(--accent)' }}
              >
                <span className="min-w-0">
                  <span className="block text-lg font-bold sm:text-xl" style={{ color: 'var(--text-primary)' }}>
                    {t(`agentsOffice.world.projects.items.${id}.name`)}
                  </span>
                  <span className="mt-1 block text-sm font-normal" style={{ color: 'var(--text-secondary)' }}>
                    {t(`agentsOffice.world.projects.items.${id}.tagline`)}
                  </span>
                </span>
                <ChevronDown
                  size={22}
                  aria-hidden="true"
                  className="mt-1 shrink-0 transition-transform duration-300"
                  style={{ color: 'var(--accent)', transform: expanded ? 'rotate(180deg)' : 'none' }}
                />
              </button>
            </h3>
            <div className="px-4 pb-4 sm:px-6">
              <Tags id={id} />
            </div>

            <AnimatePresence initial={false}>
              {expanded && (
                <motion.div
                  id={panelId}
                  key="details"
                  role="region"
                  aria-label={t(`agentsOffice.world.projects.items.${id}.name`)}
                  className="overflow-hidden"
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: reduceMotion ? 0 : 0.3, ease: 'easeOut' }}
                >
                  <Details project={project} />
                </motion.div>
              )}
            </AnimatePresence>
          </motion.li>
        )
      })}
    </ul>
  )
}
