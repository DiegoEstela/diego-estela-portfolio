import { motion, useReducedMotion } from 'framer-motion'
import { BadgeCheck, ExternalLink, ShieldCheck } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { CERTIFICATIONS, certificationStatus, type Certification } from './certifications'

const STATUS_KEY = { done: 'statusDone', inProgress: 'statusInProgress', finished: 'statusFinished' } as const

function CertificationCard({ cert, index }: { cert: Certification; index: number }) {
  const { t } = useTranslation()
  const reduceMotion = useReducedMotion()
  const base = `agentsOffice.world.certs.items.${cert.id}`
  const name = t(`${base}.name`)
  const topics = t(`${base}.topics`, { returnObjects: true }) as unknown
  const status = certificationStatus(cert)

  return (
    <motion.li
      className="world-card grid gap-5 p-4 sm:p-6 md:grid-cols-[minmax(0,2fr)_minmax(0,3fr)]"
      initial={{ opacity: 0, y: reduceMotion ? 0 : 24 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: reduceMotion ? 0 : 0.5, delay: reduceMotion ? 0 : 0.1 * index }}
    >
      {cert.image ? (
        <a
          href={cert.image}
          target="_blank"
          rel="noopener noreferrer"
          className="block self-start overflow-hidden rounded-md focus-visible:outline-2 focus-visible:outline-offset-2"
          style={{ border: '1px solid var(--border)', outlineColor: 'var(--accent)' }}
        >
          <img src={cert.image} alt={t('agentsOffice.world.certs.imageAlt', { name })} width={cert.imageSize?.width} height={cert.imageSize?.height} loading="lazy" className="h-auto w-full" />
          <span className="sr-only">{t('agentsOffice.world.certs.viewImage')}</span>
        </a>
      ) : (
        <div
          className="flex min-h-40 flex-col items-center justify-center gap-3 rounded-md p-4 text-center text-sm"
          style={{ border: '1px dashed var(--accent)', color: 'var(--text-secondary)' }}
        >
          <ShieldCheck size={36} aria-hidden="true" style={{ color: 'var(--accent)' }} />
          {t('agentsOffice.world.certs.noImage')}
        </div>
      )}

      <div className="min-w-0 text-sm" style={{ color: 'var(--text-secondary)' }}>
        <p className="world-chip mb-3 inline-flex items-center gap-1.5">
          <BadgeCheck size={14} aria-hidden="true" />
          {t(`agentsOffice.world.certs.${STATUS_KEY[status]}`)}
        </p>
        <h3 className="text-lg font-bold sm:text-xl" style={{ color: 'var(--text-primary)' }}>
          {name}
        </h3>
        <p className="mt-1 font-semibold" style={{ color: 'var(--accent)' }}>
          {t(`${base}.issuer`)}
        </p>
        <p className="mt-1">
          {t(`${base}.date`)} · {t(`${base}.duration`)}
        </p>

        <p className="mt-4 leading-relaxed">{t(`${base}.summary`)}</p>

        <h4 className="world-label mb-2 mt-4">{t('agentsOffice.world.certs.topicsLabel')}</h4>
        <ul className="list-disc space-y-1 pl-5 leading-relaxed">
          {Array.isArray(topics) && topics.map((topic) => <li key={String(topic)}>{String(topic)}</li>)}
        </ul>

        {cert.verifyUrl && (
          <div className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-2">
            <a
              href={cert.verifyUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="world-cta-ghost inline-flex min-h-11 items-center gap-2 px-5 text-sm font-semibold focus-visible:outline-2 focus-visible:outline-offset-2"
            >
              <ExternalLink size={16} aria-hidden="true" />
              {t('agentsOffice.world.certs.verify')}
              <span className="sr-only"> — {name}</span>
            </a>
            {cert.credentialId && (
              <p className="break-all text-xs">
                {t('agentsOffice.world.certs.credentialLabel')}: <span className="font-mono">{cert.credentialId}</span>
              </p>
            )}
          </div>
        )}
      </div>
    </motion.li>
  )
}

/** The certifications: the diploma when there is one, and what each training covered. */
export function CertificationsShowcase() {
  return (
    <ul className="grid gap-5">
      {CERTIFICATIONS.map((cert, index) => (
        <CertificationCard key={cert.id} cert={cert} index={index} />
      ))}
    </ul>
  )
}
