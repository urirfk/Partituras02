import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { SvgSystem } from './SvgSystem'
import { partitionMeasuresIntoSystems } from '../layout/systemPartitioning'
import type { Measure } from '../../types/music'

describe('SvgSystem Component', () => {
  const measure34: Measure = {
    number: 34,
    chords: [
      { id: 'c34-1', root: 'Si', quality: '', fullText: 'Si♭', beat: 1 },
      { id: 'c34-2', root: 'Si', quality: '7', fullText: 'Si♭7', beat: 3 },
    ],
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
      {
        id: 'n34-2',
        pitch: {
          step: 'F',
          octave: 4,
          accidental: 'natural',
          solfege: 'fa',
          displayBadgeText: 'fa',
        },
        duration: 'eighth',
        dots: 0,
        isRest: false,
        tuplet: { count: 1, total: 3 },
      },
      {
        id: 'n34-3',
        pitch: {
          step: 'G',
          octave: 4,
          accidental: 'natural',
          solfege: 'sol',
          displayBadgeText: 'sol',
        },
        duration: 'eighth',
        dots: 0,
        isRest: false,
        tuplet: { count: 2, total: 3 },
      },
      {
        id: 'n34-4',
        pitch: {
          step: 'A',
          octave: 4,
          accidental: 'natural',
          solfege: 'la',
          displayBadgeText: 'la',
        },
        duration: 'eighth',
        dots: 0,
        isRest: false,
        tuplet: { count: 3, total: 3 },
      },
    ],
  }

  const measure35: Measure = {
    number: 35,
    chords: [
      { id: 'c35-1', root: 'Do', quality: 'm', fullText: 'Dom', beat: 1 },
    ],
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

    // Chords rendered in Latin by default
    expect(screen.getByTestId('chord-text-c34-1')).toHaveTextContent('Si♭')
    expect(screen.getByTestId('chord-text-c34-2')).toHaveTextContent('Si♭7')
    expect(screen.getByTestId('chord-text-c35-1')).toHaveTextContent('Dom')

    // Tuplet triplet bracket rendered with number 3
    expect(screen.getByTestId('tuplet-bracket')).toBeInTheDocument()
    expect(screen.getByTestId('tuplet-number')).toHaveTextContent('3')

    // Fingerings and Lyrics rendered
    expect(screen.getAllByTestId('note-fingering')[0]).toHaveTextContent('3')
    expect(screen.getAllByTestId('note-lyrics')[0]).toHaveTextContent('gar-')
  })

  it('switches chords to American notation when chordNotation="american"', () => {
    const systems = partitionMeasuresIntoSystems([measure34, measure35], {
      measuresPerSystem: 2,
      systemWidth: 800,
    })

    render(
      <svg>
        <SvgSystem system={systems[0]} chordNotation="american" />
      </svg>,
    )

    expect(screen.getByTestId('chord-text-c34-1')).toHaveTextContent('B♭')
    expect(screen.getByTestId('chord-text-c34-2')).toHaveTextContent('B♭7')
    expect(screen.getByTestId('chord-text-c35-1')).toHaveTextContent('Cm')
  })

  it('hides chords orthogonally when showChords is false', () => {
    const systems = partitionMeasuresIntoSystems([measure34, measure35], {
      measuresPerSystem: 2,
      systemWidth: 800,
    })

    render(
      <svg>
        <SvgSystem system={systems[0]} showChords={false} />
      </svg>,
    )

    expect(screen.queryByTestId('chord-text-c34-1')).not.toBeInTheDocument()
    expect(screen.queryByTestId('chord-text-c35-1')).not.toBeInTheDocument()
    // Notes and tuplets remain unaffected
    expect(screen.getByText('mi')).toBeInTheDocument()
    expect(screen.getByTestId('tuplet-bracket')).toBeInTheDocument()
  })

  it('hides tuplets orthogonally when showTuplets is false', () => {
    const systems = partitionMeasuresIntoSystems([measure34, measure35], {
      measuresPerSystem: 2,
      systemWidth: 800,
    })

    render(
      <svg>
        <SvgSystem system={systems[0]} showTuplets={false} />
      </svg>,
    )

    expect(screen.queryByTestId('tuplet-bracket')).not.toBeInTheDocument()
    // Chords and notes remain unaffected
    expect(screen.getByTestId('chord-text-c34-1')).toBeInTheDocument()
    expect(screen.getByText('mi')).toBeInTheDocument()
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
