import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { GrandStaffBrace } from './GrandStaffBrace'

describe('GrandStaffBrace Component', () => {
  it('renders the vertical connector line and ornate curly bracket between staves', () => {
    render(
      <svg>
        <GrandStaffBrace topY={60} bottomY={180} />
      </svg>,
    )

    expect(screen.getByTestId('grand-staff-brace')).toBeInTheDocument()
    expect(screen.getByTestId('brace-vertical-line')).toBeInTheDocument()
    expect(screen.getByTestId('brace-bracket-path')).toBeInTheDocument()

    const line = screen.getByTestId('brace-vertical-line')
    expect(line).toHaveAttribute('y1', '60')
    expect(line).toHaveAttribute('y2', '180')
  })

  it('honors custom coordinates and styling', () => {
    render(
      <svg>
        <GrandStaffBrace
          x={20}
          topY={50}
          bottomY={210}
          braceWidth={14}
          fillColor="#000000"
        />
      </svg>,
    )

    const line = screen.getByTestId('brace-vertical-line')
    expect(line).toHaveAttribute('x1', '20')
    expect(line).toHaveAttribute('y1', '50')
    expect(line).toHaveAttribute('y2', '210')
    expect(line).toHaveAttribute('stroke', '#000000')

    const path = screen.getByTestId('brace-bracket-path')
    expect(path).toHaveAttribute('fill', '#000000')
  })
})
