import { describe, expect, it } from 'vitest'
import { render, screen } from '@testing-library/react'
import { useTheme } from '@/hooks/useTheme'

function Probe() {
  const { theme } = useTheme()
  return <p>{theme}</p>
}

describe('useTheme', () => {
  it('defaults to dark theme without a provider', () => {
    render(<Probe />)
    expect(screen.getByText('dark')).toBeInTheDocument()
  })
})
