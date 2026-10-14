import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import fs from 'node:fs'
import { SvgSystem } from '../../renderer/svg/SvgSystem'
import { partitionMeasuresIntoSystems } from '../../renderer/layout/systemPartitioning'
import type { Measure, Note } from '../../types/music'

describe('Visual Rendering Verification & Anti-Overflow Suite', () => {
  const createNote = (
    id: string,
    step: 'C' | 'D' | 'E' | 'F' | 'G' | 'A' | 'B',
    octave: number,
    duration: Note['duration'],
    tie?: Note['tie'],
  ): Note => ({
    id,
    duration,
    dots: 0,
    isRest: false,
    tie,
    pitch: {
      step,
      octave,
      accidental: 'natural',
      solfege: 'do',
      displayBadgeText: 'do',
    },
  })

  it('guarantees that a rapid 16-note arpeggio never overflows outside measure boundary', () => {
    // 16 sixteenth notes in measure 1
    const steps: ('C' | 'D' | 'E' | 'F' | 'G' | 'A' | 'B')[] = ['C', 'E', 'G', 'B']
    const notes: Note[] = Array.from({ length: 16 }, (_, i) =>
      createNote(`n${i}`, steps[i % 4], 4 + Math.floor(i / 7), '16th'),
    )

    const measure: Measure = {
      number: 1,
      chords: [],
      notes,
    }

    const systemWidth = 800
    const leftMargin = 50
    const systems = partitionMeasuresIntoSystems([measure], {
      measuresPerSystem: 1,
      systemWidth,
      leftMargin,
    })

    expect(systems).toHaveLength(1)
    const system = systems[0]
    const layoutedMeasure = system.measures[0]

    // Verify all 16 notes are strictly <= measure right boundary
    const maxMeasureX = layoutedMeasure.startX + layoutedMeasure.width - 15 // endPadding margin
    for (const pn of layoutedMeasure.positionedNotes) {
      expect(pn.x).toBeLessThanOrEqual(maxMeasureX)
      expect(pn.x).toBeGreaterThanOrEqual(layoutedMeasure.startX)
    }

    // Render the SVG system
    render(
      <svg width={systemWidth} height={200}>
        <SvgSystem system={system} />
      </svg>,
    )

    // Verify beam bars are rendered for the 16th notes
    const beamBars = screen.getAllByTestId('beam-bar')
    expect(beamBars.length).toBeGreaterThan(0)

    // Verify individual flags are suppressed (no clutter)
    expect(screen.queryByTestId('note-flag')).not.toBeInTheDocument()

    // Verify 16 notes are present in the DOM
    const renderedNotes = screen.getAllByTestId('svg-note')
    expect(renderedNotes).toHaveLength(16)
  })

  it('renders curved tie arcs for tied notes and connects correctly', () => {
    const tiedMeasure: Measure = {
      number: 1,
      chords: [],
      notes: [
        createNote('t1', 'E', 4, 'quarter', 'start'),
        createNote('t2', 'E', 4, 'quarter', 'stop'),
        createNote('t3', 'G', 4, 'half', 'start'), // continues past barline
      ],
    }

    const systems = partitionMeasuresIntoSystems([tiedMeasure], {
      measuresPerSystem: 1,
      systemWidth: 600,
    })

    render(
      <svg width={600} height={200}>
        <SvgSystem system={systems[0]} />
      </svg>,
    )

    // Expect 2 tie arcs: one between t1 and t2, one from t3 extending towards the barline
    const tieArcs = screen.getAllByTestId('note-tie')
    expect(tieArcs).toHaveLength(2)
  })

  it('renders Grand Staff with synchronized notes and no boundary overflow across both staves', () => {
    // 8 eighth notes in right hand, 4 quarter notes in left hand
    const upperNotes: Note[] = Array.from({ length: 8 }, (_, i) =>
      createNote(`u${i}`, 'E', 4, 'eighth'),
    )
    const lowerNotes: Note[] = Array.from({ length: 4 }, (_, i) =>
      createNote(`l${i}`, 'C', 3, 'quarter'),
    )

    const grandMeasure: Measure = {
      number: 1,
      chords: [],
      notes: upperNotes,
      lowerNotes,
    }

    const systems = partitionMeasuresIntoSystems([grandMeasure], {
      measuresPerSystem: 1,
      systemWidth: 700,
      leftMargin: 60,
    })

    const layoutedMeasure = systems[0].measures[0]
    const maxMeasureX = layoutedMeasure.startX + layoutedMeasure.width

    for (const pn of layoutedMeasure.positionedNotes) {
      expect(pn.x).toBeLessThan(maxMeasureX)
    }
    for (const pn of layoutedMeasure.positionedLowerNotes!) {
      expect(pn.x).toBeLessThan(maxMeasureX)
    }

    render(
      <svg width={700} height={300}>
        <SvgSystem system={systems[0]} staffType="grand" />
      </svg>,
    )

    // Upper eighth notes should be beamed
    expect(screen.getAllByTestId('beam-bar').length).toBeGreaterThan(0)
    expect(screen.queryByTestId('note-flag')).not.toBeInTheDocument()

    // 8 upper notes + 4 lower notes = 12 total
    expect(screen.getAllByTestId('svg-note')).toHaveLength(12)
  })

  it('generates a full pedagogical score SVG sample for visual inspection', () => {
    // Measure 1: 8 eighth notes beamed in 4 beats with a tie
    const m1Notes: Note[] = [
      createNote('m1-1', 'C', 4, 'eighth'),
      createNote('m1-2', 'D', 4, 'eighth'),
      createNote('m1-3', 'E', 4, 'eighth', 'start'),
      createNote('m1-4', 'E', 4, 'eighth', 'stop'),
      createNote('m1-5', 'F', 4, 'eighth'),
      createNote('m1-6', 'G', 4, 'eighth'),
      createNote('m1-7', 'A', 4, 'eighth'),
      createNote('m1-8', 'B', 4, 'eighth', 'start'),
    ]

    const m1Lower: Note[] = [
      createNote('m1-l1', 'C', 3, 'quarter'),
      createNote('m1-l2', 'G', 3, 'quarter'),
      createNote('m1-l3', 'E', 3, 'quarter'),
      createNote('m1-l4', 'G', 3, 'quarter'),
    ]

    // Measure 2: tied arrival on beat 1, followed by quarter and half notes
    const m2Notes: Note[] = [
      createNote('m2-1', 'B', 4, 'quarter', 'stop'),
      createNote('m2-2', 'G', 4, 'quarter'),
      createNote('m2-3', 'C', 5, 'half'),
    ]

    const m2Lower: Note[] = [
      createNote('m2-l1', 'C', 3, 'half'),
      createNote('m2-l2', 'C', 3, 'half'),
    ]

    const measure1: Measure = {
      number: 1,
      chords: [
        { id: 'c1', root: 'Do', quality: '', fullText: 'Do', beat: 1 },
        { id: 'c2', root: 'Sol', quality: '7', fullText: 'Sol7', beat: 3 },
      ],
      notes: m1Notes,
      lowerNotes: m1Lower,
    }

    const measure2: Measure = {
      number: 2,
      chords: [{ id: 'c3', root: 'Do', quality: '', fullText: 'Do', beat: 1 }],
      notes: m2Notes,
      lowerNotes: m2Lower,
    }

    const systems = partitionMeasuresIntoSystems([measure1, measure2], {
      measuresPerSystem: 2,
      systemWidth: 840,
      leftMargin: 60,
    })

    const { container } = render(
      <svg
        width="840"
        height="260"
        viewBox="0 0 840 260"
        xmlns="http://www.w3.org/2000/svg"
        style={{ backgroundColor: '#ffffff', fontFamily: 'sans-serif' }}
      >
        <SvgSystem system={systems[0]} staffType="grand" />
      </svg>,
    )

    const svgContent = container.innerHTML
    expect(svgContent).toContain('beam-bar')
    expect(svgContent).toContain('note-tie')
    expect(svgContent).not.toContain('note-flag')

    // Persist rendered SVG to artifacts directory for inspection
    const artifactPath =
      '/home/rfk/.gemini/antigravity/brain/d89bde79-7442-4503-984d-a5e90b1ef141/rendered_score_sample.svg'
    fs.writeFileSync(artifactPath, svgContent, 'utf-8')
    expect(fs.existsSync(artifactPath)).toBe(true)
  })
})

