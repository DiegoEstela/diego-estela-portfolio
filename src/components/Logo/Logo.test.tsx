import { describe, expect, it } from 'vitest'
import { render, screen } from '@testing-library/react'
import { Logo } from './Logo'

describe('Logo', () => {
  it('is exposed as an image named after the brand', () => {
    render(<Logo />)
    expect(screen.getByRole('img', { name: 'Delo IA Studio' })).toBeInTheDocument()
  })

  it('lets the wordmark follow the surrounding text color', () => {
    const { container } = render(<Logo className="h-9" />)
    expect(container.querySelector('path[fill="currentColor"]')).not.toBeNull()
    expect(container.querySelector('svg')?.getAttribute('class')).toBe('h-9')
  })
})
