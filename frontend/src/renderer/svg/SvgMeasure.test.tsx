import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { SvgMeasure } from './SvgMeasure'
import type { LayoutedMeasure } from '../layout/systemPartitioning'
import type { Measure } from '../../types/music'

describe('SvgMeasure Component', () => {
  const dummyMeasure: Measure = {
    number: 1,
    chords: [],
    notes: [
      {
        id: 'u1',
        pitch: { step: 'C', octave: 4, accidental: 'natural', solfege: 'do', displayBadgeText: 'do' },
        duration: 'quarter',
        dots: 0,
        isRest: false,
      },
    ],
    lowerNotes: [
      {
        id: 'l1',
        pitch: { step: 'C', octave: 3, accidental: 'natural', solfege: 'do', displayBadgeText: 'do' },
        duration: 'quarter',
        dots: 0,
        isRest: false,
      },
    ],
  }

  const singleStaffLayouted: LayoutedMeasure = {
    measure: dummyMeasure,
    startX: 50,
    width: 300,
    isFirstInSystem: true,
    positionedNotes: [{ note: dummyMeasure.notes[0], x: 100 }],
  }

  const grandStaffLayouted: LayoutedMeasure = {
    ...singleStaffLayouted,
    positionedLowerNotes: [{ note: dummyMeasure.lowerNotes![0], x: 100 }],
  }

  it('renders single staff barline stopping at upper staff bottom line', () => {
    render(
      <svg>
        <SvgMeasure
          layoutedMeasure={singleStaffLayouted}
          baseY={60}
          lineSpacing={10}
          staffType="single"
        />
      </svg>,
    )

    const barline = screen.getByTestId('barline-1')
    expect(barline).toHaveAttribute('y1', '60')
    expect(barline).toHaveAttribute('y2', '100') // 60 + 4 * 10
  })

  it('renders continuous barline traversing both staves in Grand Staff mode', () => {
    render(
      <svg>
        <SvgMeasure
          layoutedMeasure={grandStaffLayouted}
          baseY={60}
          lineSpacing={10}
          staffType="grand"
          staffGap={50}
        />
      </svg>,
    )

    const barline = screen.getByTestId('barline-1')
    expect(barline).toHaveAttribute('y1', '60')
    // bassBaseY = 60 + 40 + 50 = 150; bassBottomLineY = 150 + 40 = 190
    expect(barline).toHaveAttribute('y2', '190')
  })

  it('renders horizontal beam bar and suppresses individual flags for beamed eighth notes', () => {
    const beamedMeasure: Measure = {
      number: 2,
      chords: [],
      notes: [
        {
          id: 'b1',
          pitch: { step: 'D', octave: 4, accidental: 'natural', solfege: 're', displayBadgeText: 're' },
          duration: 'eighth',
          dots: 0,
          isRest: false,
        },
        {
          id: 'b2',
          pitch: { step: 'F', octave: 4, accidental: 'natural', solfege: 'fa', displayBadgeText: 'fa' },
          duration: 'eighth',
          dots: 0,
          isRest: false,
        },
      ],
    }

    const beamedLayouted: LayoutedMeasure = {
      measure: beamedMeasure,
      startX: 0,
      width: 250,
      isFirstInSystem: false,
      positionedNotes: [
        { note: beamedMeasure.notes[0], x: 50 },
        { note: beamedMeasure.notes[1], x: 100 },
      ],
    }

    render(
      <svg>
        <SvgMeasure
          layoutedMeasure={beamedLayouted}
          baseY={60}
          lineSpacing={10}
        />
      </svg>,
    )

    // Primary beam bar must be rendered
    expect(screen.getByTestId('beam-bar')).toBeInTheDocument()
    // Individual flags must NOT be rendered because notes are joined by beam
    expect(screen.queryByTestId('note-flag')).not.toBeInTheDocument()
  })

  it('renders curved tie arc for notes with tie: start', () => {
    const tiedMeasure: Measure = {
      number: 3,
      chords: [],
      notes: [
        {
          id: 't1',
          pitch: { step: 'G', octave: 4, accidental: 'natural', solfege: 'sol', displayBadgeText: 'sol' },
          duration: 'quarter',
          dots: 0,
          isRest: false,
          tie: 'start',
        },
        {
          id: 't2',
          pitch: { step: 'G', octave: 4, accidental: 'natural', solfege: 'sol', displayBadgeText: 'sol' },
          duration: 'quarter',
          dots: 0,
          isRest: false,
          tie: 'stop',
        },
      ],
    }

    const tiedLayouted: LayoutedMeasure = {
      measure: tiedMeasure,
      startX: 0,
      width: 250,
      isFirstInSystem: false,
      positionedNotes: [
        { note: tiedMeasure.notes[0], x: 50 },
        { note: tiedMeasure.notes[1], x: 120 },
      ],
    }

    render(
      <svg>
        <SvgMeasure
          layoutedMeasure={tiedLayouted}
          baseY={60}
          lineSpacing={10}
        />
      </svg>,
    )

    const tieArc = screen.getByTestId('note-tie')
    expect(tieArc).toBeInTheDocument()
    expect(tieArc).toHaveAttribute('d')
    expect(tieArc.getAttribute('d')).toContain('M')
    expect(tieArc.getAttribute('d')).toContain('Q')
  })
})

