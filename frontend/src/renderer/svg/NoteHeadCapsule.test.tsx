import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { NoteHeadCapsule } from './NoteHeadCapsule'
import type { Pitch } from '../../types/music'

describe('NoteHeadCapsule SVG Component', () => {
  const pitchMi: Pitch = {
    step: 'E',
    octave: 4,
    accidental: 'natural',
    solfege: 'mi',
    displayBadgeText: 'mi',
  }

  const pitchLaFlat: Pitch = {
    step: 'A',
    octave: 4,
    accidental: 'flat',
    solfege: 'la',
    displayBadgeText: '♭la',
  }

  it('renders capsule with embedded white solfege text for natural note', () => {
    render(
      <svg>
        <NoteHeadCapsule x={100} y={50} pitch={pitchMi} showNoteNames={true} showAccidentals={true} />
      </svg>,
    )

    expect(screen.getByTestId('notehead-capsule')).toBeInTheDocument()
    expect(screen.getByText('mi')).toBeInTheDocument()
  })

  it('renders capsule with explicit flat symbol when showAccidentals is true', () => {
    render(
      <svg>
        <NoteHeadCapsule x={100} y={50} pitch={pitchLaFlat} showNoteNames={true} showAccidentals={true} />
      </svg>,
    )

    expect(screen.getByText('♭la')).toBeInTheDocument()
  })

  it('omits accidental prefix when showAccidentals is false (orthogonality contract)', () => {
    render(
      <svg>
        <NoteHeadCapsule x={100} y={50} pitch={pitchLaFlat} showNoteNames={true} showAccidentals={false} />
      </svg>,
    )

    expect(screen.getByText('la')).toBeInTheDocument()
  })

  it('renders classic oval notehead when showNoteNames is false (traditional fallback)', () => {
    render(
      <svg>
        <NoteHeadCapsule x={100} y={50} pitch={pitchMi} showNoteNames={false} />
      </svg>,
    )

    expect(screen.getByTestId('classic-notehead')).toBeInTheDocument()
    expect(screen.queryByText('mi')).not.toBeInTheDocument()
  })

  it('renders nothing if note is a rest', () => {
    const { container } = render(
      <svg>
        <NoteHeadCapsule x={100} y={50} pitch={pitchMi} isRest={true} />
      </svg>,
    )

    expect(container.querySelector('g')).toBeNull()
    expect(container.querySelector('ellipse')).toBeNull()
  })
})
