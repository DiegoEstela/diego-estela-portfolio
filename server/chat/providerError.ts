export type ProviderErrorKind = 'no_credits' | 'rate_limit' | 'upstream'

/** A failure of the model provider, reduced to a stable code that is safe to show to the client. */
export class ProviderError extends Error {
  readonly kind: ProviderErrorKind
  /** HTTP status of the original provider failure, kept for server-side logs only. */
  readonly status?: number

  constructor(kind: ProviderErrorKind, status?: number) {
    super(kind)
    this.name = 'ProviderError'
    this.kind = kind
    this.status = status
  }
}

export const PROVIDER_ERROR_STATUS: Record<ProviderErrorKind, number> = {
  no_credits: 402,
  rate_limit: 429,
  upstream: 502,
}
