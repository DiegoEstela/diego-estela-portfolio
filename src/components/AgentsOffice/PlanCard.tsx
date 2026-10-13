import { useEffect, useId, useRef } from 'react'
import { useReducedMotion } from 'framer-motion'
import { useTranslation } from 'react-i18next'
import { CheckCircle2, Circle, ExternalLink } from 'lucide-react'
import { progress, type Plan } from './planParser'

interface PlanCardProps {
  /** The latest plan of the repository, or null when there is none. */
  plan: Plan | null
}

/** What the board of the wall opens: the latest plan, its progress and every task. */
export function PlanCard({ plan }: PlanCardProps) {
  const { t, i18n } = useTranslation()
  const reduceMotion = useReducedMotion()
  const cardRef = useRef<HTMLDivElement>(null)
  const progressId = useId()
  const tasksId = useId()

  // On a phone the card sits below the scene: bring it into view when the board is tapped.
  useEffect(() => {
    cardRef.current?.scrollIntoView({ block: 'nearest', behavior: reduceMotion ? 'auto' : 'smooth' })
  }, [reduceMotion])

  const { done, total } = plan ? progress(plan) : { done: 0, total: 0 }
  const progressText = t('agentsOffice.plan.progressText', { done, total })

  return (
    <div
      ref={cardRef}
      className="rounded-2xl p-4 sm:p-5"
      style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', minHeight: 168 }}
    >
      {plan === null ? (
        <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
          {t('agentsOffice.plan.empty')}
        </p>
      ) : (
        <div className="flex flex-col gap-3">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--accent)' }}>
              {t('agentsOffice.plan.latest')}
            </p>
            {/* Plans are written in Spanish whatever the language of the page. */}
            <h3 lang="es" className="mt-1 text-lg font-bold" style={{ color: 'var(--text-primary)' }}>
              {plan.title}
            </h3>
          </div>

          {plan.issueUrl && (
            <a
              href={plan.issueUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex w-fit items-center gap-1.5 text-sm font-medium underline-offset-2 hover:underline focus-visible:outline-2 focus-visible:outline-offset-2"
              style={{ color: 'var(--accent)', outlineColor: 'var(--accent)' }}
            >
              {t('agentsOffice.plan.issueLink', { number: plan.issue })}
              <ExternalLink size={14} aria-hidden="true" />
            </a>
          )}

          {total === 0 ? (
            <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
              {t('agentsOffice.plan.noTasks')}
            </p>
          ) : (
            <>
              <div>
                <p id={progressId} className="mb-1.5 text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--accent)' }}>
                  {t('agentsOffice.plan.progressLabel')}
                </p>
                <div
                  role="progressbar"
                  aria-labelledby={progressId}
                  aria-valuemin={0}
                  aria-valuemax={total}
                  aria-valuenow={done}
                  aria-valuetext={progressText}
                  className="h-3 w-full overflow-hidden rounded-full"
                  style={{ background: 'var(--bg-primary)', border: '1px solid var(--border)' }}
                >
                  <div className="h-full" style={{ width: `${(done / total) * 100}%`, background: 'var(--accent)' }} />
                </div>
                <p className="mt-1.5 text-sm" style={{ color: 'var(--text-primary)' }}>
                  {progressText}
                </p>
              </div>

              <div>
                <p id={tasksId} className="mb-1.5 text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--accent)' }}>
                  {t('agentsOffice.plan.tasksLabel')}
                </p>
                <ol aria-labelledby={tasksId} className="space-y-1 text-sm" style={{ color: 'var(--text-primary)' }}>
                  {/* Titles can repeat and the list never reorders, so the index is a fine key. */}
                  {plan.tasks.map((task, index) => (
                    <li key={index} className="flex items-start gap-2">
                      {task.done ? (
                        <CheckCircle2 size={16} aria-hidden="true" className="mt-0.5 shrink-0" style={{ color: 'var(--accent)' }} />
                      ) : (
                        <Circle size={16} aria-hidden="true" className="mt-0.5 shrink-0" style={{ color: 'var(--text-secondary)' }} />
                      )}
                      <span className="sr-only">{task.done ? t('agentsOffice.plan.done') : t('agentsOffice.plan.pending')}: </span>
                      <span lang="es">{task.title}</span>
                    </li>
                  ))}
                </ol>
              </div>

              {!i18n.language.startsWith('es') && (
                <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>
                  {t('agentsOffice.plan.spanishNote')}
                </p>
              )}
            </>
          )}
        </div>
      )}
    </div>
  )
}
