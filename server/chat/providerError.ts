export type ProviderErrorKind = 'no_credits' | 'rate_limit' | 'upstream'

/** A failure of the model provider, reduced to a stable code that is safe to show to the client. */
export class ProviderError extends Error {
  readonly kind: ProviderErrorKind

  constructor(kind: ProviderErrorKind) {
    super(kind)
    this.name = 'ProviderError'
    this.kind = kind
  }
}

export const PROVIDER_ERROR_STATUS: Record<ProviderErrorKind, number> = {
  no_credits: 402,
  rate_limit: 429,
  upstream: 502,
}
