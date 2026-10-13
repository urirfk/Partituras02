import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { TupletBracket } from './TupletBracket'

describe('TupletBracket Component', () => {
  it('renders a triplet bracket with default number 3 and arms', () => {
    render(
      <svg>
        <TupletBracket startX={100} endX={180} y={40} />
      </svg>,
    )

    expect(screen.getByTestId('tuplet-bracket')).toBeInTheDocument()
    expect(screen.getByTestId('tuplet-number')).toHaveTextContent('3')
    expect(screen.getByTestId('tuplet-left-arm')).toBeInTheDocument()
    expect(screen.getByTestId('tuplet-right-arm')).toBeInTheDocument()
  })

  it('renders custom tuplet number (e.g. quintuplet 5)', () => {
    render(
      <svg>
        <TupletBracket startX={200} endX={320} y={40} number={5} />
      </svg>,
    )

    expect(screen.getByTestId('tuplet-number')).toHaveTextContent('5')
  })
})
