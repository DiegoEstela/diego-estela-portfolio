/**
 * The certifications of the "AI world". Their text lives in the locales, under
 * `agentsOffice.world.certs.items.<id>`.
 */
export interface Certification {
  id: 'udemy' | 'claude' | 'security'
  /** Scan of the certificate, served from `public/`. Missing while the training has no certificate yet. */
  image?: string
  /** Pixel size of that image, so the page reserves its space before it loads. */
  imageSize?: { width: number; height: number }
  /** Where anyone can check the credential. */
  verifyUrl?: string
  credentialId?: string
  /** Last day of a training that is still running (YYYY-MM-DD). Without it, the certificate is already issued. */
  endsOn?: string
}

export const CERTIFICATIONS: readonly Certification[] = [
  {
    id: 'udemy',
    image: '/certifications/udemy-desarrollo-web-ia.png',
    imageSize: { width: 872, height: 642 },
    verifyUrl: 'https://ude.my/UC-3f436f5d-672b-46a6-baac-027daa61758a',
    credentialId: 'UC-3f436f5d-672b-46a6-baac-027daa61758a',
  },
  { id: 'claude', image: '/certifications/dexs-claude-code.png', imageSize: { width: 1242, height: 881 } },
  { id: 'security', endsOn: '2026-10-27' },
]

export type CertificationStatus = 'done' | 'inProgress' | 'finished'

/**
 * What to show next to a certification. An issued certificate is "done"; a training with no
 * certificate yet is "inProgress" until its last day is over, and then "finished", which promises
 * nothing about a diploma that may not exist yet.
 */
export function certificationStatus({ endsOn, image }: Certification, today: Date = new Date()): CertificationStatus {
  if (!endsOn) return 'done'
  const end = new Date(`${endsOn}T23:59:59`)
  if (today <= end) return 'inProgress'
  return image ? 'done' : 'finished'
}
