import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { SvgSystem } from './SvgSystem'
import { partitionMeasuresIntoSystems } from '../layout/systemPartitioning'
import type { Measure } from '../../types/music'

describe('SvgSystem Component', () => {
  const measure34: Measure = {
    number: 34,
    chords: [],
    notes: [
      {
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
      },
    ],
  }

  const measure35: Measure = {
    number: 35,
    chords: [],
    notes: [
      {
        id: 'n35-1',
        pitch: {
          step: 'B',
          octave: 4,
          accidental: 'flat',
          solfege: 'si',
          displayBadgeText: '♭si',
        },
        duration: 'eighth',
        dots: 0,
        isRest: false,
        fingering: 2,
        lyrics: 'y',
      },
    ],
  }

  it('renders a full 2-measure system with starting measure number 34 and continuous staff', () => {
    const systems = partitionMeasuresIntoSystems([measure34, measure35], {
      measuresPerSystem: 2,
      systemWidth: 800,
    })

    expect(systems.length).toBe(1)

    render(
      <svg>
        <SvgSystem system={systems[0]} />
      </svg>,
    )

    // Starting measure number 34 at left edge
    expect(screen.getByTestId('system-measure-number')).toHaveTextContent('34')

    // Continuous staff lines
    expect(screen.getByTestId('staff-lines-group')).toBeInTheDocument()

    // Measure 34 and 35 rendered
    expect(screen.getByTestId('svg-measure-34')).toBeInTheDocument()
    expect(screen.getByTestId('svg-measure-35')).toBeInTheDocument()

    // Barlines separating measures
    expect(screen.getByTestId('barline-34')).toBeInTheDocument()
    expect(screen.getByTestId('barline-35')).toBeInTheDocument()

    // Both note capsules rendered
    expect(screen.getByText('mi')).toBeInTheDocument()
    expect(screen.getByText('♭si')).toBeInTheDocument()
  })

  it('hides measure numbers when showMeasureNumbers is false', () => {
    const systems = partitionMeasuresIntoSystems([measure34, measure35], {
      measuresPerSystem: 2,
    })

    render(
      <svg>
        <SvgSystem system={systems[0]} showMeasureNumbers={false} />
      </svg>,
    )

    expect(screen.queryByTestId('system-measure-number')).not.toBeInTheDocument()
  })
})
