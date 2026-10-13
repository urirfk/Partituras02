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
})
