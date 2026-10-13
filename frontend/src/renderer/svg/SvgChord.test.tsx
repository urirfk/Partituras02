import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { SvgChord } from './SvgChord'
import { formatChordText } from './chordFormatting'
import type { ChordSymbol } from '../../types/music'

describe('SvgChord Component', () => {
  const chordSib7: ChordSymbol = {
    id: 'c34-2',
    root: 'Si',
    quality: 'b7',
    fullText: 'Si♭7',
    beat: 3,
  }

  const chordDom: ChordSymbol = {
    id: 'c36-1',
    root: 'Do',
    quality: 'm',
    fullText: 'Dom',
    beat: 1,
  }

  it('formats chord text between Latin and American notation seamlessly', () => {
    // Latin to American
    expect(formatChordText('Si♭7', 'Si', 'american')).toBe('B♭7')
    expect(formatChordText('Dom', 'Do', 'american')).toBe('Cm')
    expect(formatChordText('Mi♭', 'Mi', 'american')).toBe('E♭')

    // Latin default
    expect(formatChordText('Si♭7', 'Si', 'latin')).toBe('Si♭7')
    expect(formatChordText('Dom', 'Do', 'latin')).toBe('Dom')

    // American to Latin
    expect(formatChordText('Cm', 'C', 'latin')).toBe('Dom')
    expect(formatChordText('Bb7', 'B', 'latin')).toBe('Sib7')
  })

  it('renders chord symbol in bold text at specified coordinates', () => {
    render(
      <svg>
        <SvgChord chord={chordSib7} x={150} y={30} notation="latin" />
      </svg>,
    )

    const chordEl = screen.getByTestId('svg-chord')
    expect(chordEl).toBeInTheDocument()
    expect(screen.getByText('Si♭7')).toBeInTheDocument()
  })

  it('converts to American notation when notation is set to american', () => {
    render(
      <svg>
        <SvgChord chord={chordDom} x={100} y={30} notation="american" />
      </svg>,
    )

    expect(screen.getByText('Cm')).toBeInTheDocument()
    expect(screen.queryByText('Dom')).not.toBeInTheDocument()
  })

  it('returns null when showChords is false (orthogonal control contract)', () => {
    const { container } = render(
      <svg>
        <SvgChord chord={chordSib7} x={150} y={30} showChords={false} />
      </svg>,
    )

    expect(container.querySelector('g')).toBeNull()
    expect(screen.queryByText('Si♭7')).not.toBeInTheDocument()
  })

  it('triggers onClick handler when clicked', () => {
    const handleClick = vi.fn()
    render(
      <svg>
        <SvgChord chord={chordSib7} x={150} y={30} onClick={handleClick} />
      </svg>,
    )

    fireEvent.click(screen.getByTestId('svg-chord'))
    expect(handleClick).toHaveBeenCalledTimes(1)
  })
})
