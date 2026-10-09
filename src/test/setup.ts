import '@testing-library/jest-dom/vitest'
import { afterEach, vi } from 'vitest'
import { cleanup } from '@testing-library/react'

// jsdom does not implement scrollIntoView (server tests run in a node environment without Element)
if (typeof Element !== 'undefined') {
  Element.prototype.scrollIntoView = vi.fn()
}

afterEach(() => cleanup())
