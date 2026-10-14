import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { SvgNote } from './SvgNote'
import type { Note } from '../../types/music'

describe('SvgNote Component', () => {
  const sampleNote: Note = {
    id: 'n34-1',
    pitch: {
      step: 'E',
      octave: 4,
      accidental: 'natural',
      solfege: 'mi',
      displayBadgeText: 'mi',
    },
    duration: 'quarter',
    dots: 0,
    isRest: false,
    fingering: 3,
    lyrics: 'gar-',
  }

  const flatDottedEighthNote: Note = {
    id: 'n34-2',
    pitch: {
      step: 'B',
      octave: 4,
      accidental: 'flat',
      solfege: 'si',
      displayBadgeText: '♭si',
    },
    duration: 'eighth',
    dots: 1,
    isRest: false,
    fingering: 2,
    lyrics: 'te',
  }

  const restNote: Note = {
    id: 'r1',
    isRest: true,
    duration: 'quarter',
    dots: 0,
  }

  it('renders a full didactic note with capsule notehead, stem, fingering, and lyrics', () => {
    render(
      <svg>
        <SvgNote note={sampleNote} x={100} baseY={50} lineSpacing={10} />
      </svg>,
    )

    expect(screen.getByTestId('svg-note')).toBeInTheDocument()
    expect(screen.getByTestId('notehead-capsule')).toBeInTheDocument()
    expect(screen.getByText('mi')).toBeInTheDocument()
    expect(screen.getByTestId('note-stem')).toBeInTheDocument()
    expect(screen.getByTestId('note-fingering')).toHaveTextContent('3')
    expect(screen.getByTestId('note-lyrics')).toHaveTextContent('gar-')
  })

  it('renders augmentation dot and flag for eighth dotted note with flat accidental', () => {
    render(
      <svg>
        <SvgNote note={flatDottedEighthNote} x={150} baseY={50} lineSpacing={10} />
      </svg>,
    )

    expect(screen.getByText('♭si')).toBeInTheDocument()
    expect(screen.getByTestId('note-dot')).toBeInTheDocument()
    expect(screen.getByTestId('note-flag')).toBeInTheDocument()
    expect(screen.getByTestId('note-fingering')).toHaveTextContent('2')
    expect(screen.getByTestId('note-lyrics')).toHaveTextContent('te')
  })

  it('honors orthogonal display toggles for fingerings and lyrics', () => {
    render(
      <svg>
        <SvgNote
          note={sampleNote}
          x={100}
          baseY={50}
          showFingerings={false}
          showLyrics={false}
        />
      </svg>,
    )

    expect(screen.queryByTestId('note-fingering')).not.toBeInTheDocument()
    expect(screen.queryByTestId('note-lyrics')).not.toBeInTheDocument()
    // Other elements must remain intact
    expect(screen.getByText('mi')).toBeInTheDocument()
    expect(screen.getByTestId('note-stem')).toBeInTheDocument()
  })

  it('renders rest notes without noteheads, stems, or fingerings', () => {
    render(
      <svg>
        <SvgNote note={restNote} x={200} baseY={50} />
      </svg>,
    )

    expect(screen.getByTestId('svg-rest')).toBeInTheDocument()
    expect(screen.queryByTestId('notehead-capsule')).not.toBeInTheDocument()
    expect(screen.queryByTestId('note-stem')).not.toBeInTheDocument()
  })

  it('calls onClick callback when notehead is clicked', () => {
    const handleClick = vi.fn()
    render(
      <svg>
        <SvgNote note={sampleNote} x={100} baseY={50} onClick={handleClick} />
      </svg>,
    )

    fireEvent.click(screen.getByTestId('notehead-capsule'))
    expect(handleClick).toHaveBeenCalledTimes(1)
  })

  it('suppresses flag when isBeamed is true and uses stemEndYOverride', () => {
    render(
      <svg>
        <SvgNote
          note={flatDottedEighthNote}
          x={150}
          baseY={50}
          isBeamed={true}
          stemEndYOverride={25}
        />
      </svg>,
    )

    // Flag must be suppressed
    expect(screen.queryByTestId('note-flag')).not.toBeInTheDocument()
    // Stem must use stemEndYOverride
    const stem = screen.getByTestId('note-stem')
    expect(stem).toHaveAttribute('y2', '25')
  })
})

