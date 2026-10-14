import { describe, it, expect } from 'vitest'
import { findBeamGroups } from './measureBeaming'
import type { PositionedNote } from './measureSpacing'
import type { Note } from '../../types/music'

describe('measureBeaming Engine', () => {
  const createEighth = (id: string, step: 'C' | 'D' | 'E' | 'F' | 'G' | 'A' | 'B', octave = 4): Note => ({
    id,
    duration: 'eighth',
    dots: 0,
    isRest: false,
    pitch: {
      step,
      octave,
      accidental: 'natural',
      solfege: 'do',
      displayBadgeText: 'do',
    },
  })

  const create16th = (id: string, step: 'C' | 'D' | 'E' | 'F' | 'G' | 'A' | 'B', octave = 4): Note => ({
    id,
    duration: '16th',
    dots: 0,
    isRest: false,
    pitch: {
      step,
      octave,
      accidental: 'natural',
      solfege: 're',
      displayBadgeText: 're',
    },
  })

  const createQuarter = (id: string): Note => ({
    id,
    duration: 'quarter',
    dots: 0,
    isRest: false,
    pitch: {
      step: 'C',
      octave: 4,
      accidental: 'natural',
      solfege: 'do',
      displayBadgeText: 'do',
    },
  })

  const createRest = (id: string, duration: Note['duration'] = 'eighth'): Note => ({
    id,
    duration,
    dots: 0,
    isRest: true,
  })

  it('groups 2 consecutive eighth notes within beat 1 into a beam group', () => {
    const positionedNotes: PositionedNote[] = [
      { note: createEighth('n1', 'E', 4), x: 50 },
      { note: createEighth('n2', 'G', 4), x: 90 },
      { note: createQuarter('n3'), x: 150 },
    ]

    const groups = findBeamGroups(positionedNotes, {
      baseY: 60,
      lineSpacing: 10,
    })

    expect(groups).toHaveLength(1)
    expect(groups[0].notes).toHaveLength(2)
    expect(groups[0].startX).toBeLessThan(groups[0].endX)
    expect(groups[0].stemDirection).toBe('up') // E4 and G4 are below middle line (diatonicIndex 2 and 4)
  })

  it('breaks beam groups when an eighth note is separated by a rest', () => {
    const positionedNotes: PositionedNote[] = [
      { note: createEighth('n1', 'E', 4), x: 50 },
      { note: createRest('r1', 'eighth'), x: 90 },
      { note: createEighth('n2', 'G', 4), x: 130 },
    ]

    const groups = findBeamGroups(positionedNotes, {
      baseY: 60,
    })

    // Both are isolated (1 note each), so neither forms a beam group
    expect(groups).toHaveLength(0)
  })

  it('generates secondary beam segments for 16th notes', () => {
    // 4 sixteenth notes filling beat 1
    const positionedNotes: PositionedNote[] = [
      { note: create16th('s1', 'C', 5), x: 50 },
      { note: create16th('s2', 'D', 5), x: 75 },
      { note: create16th('s3', 'E', 5), x: 100 },
      { note: create16th('s4', 'F', 5), x: 125 },
    ]

    const groups = findBeamGroups(positionedNotes, {
      baseY: 60,
    })

    expect(groups).toHaveLength(1)
    expect(groups[0].notes).toHaveLength(4)
    expect(groups[0].stemDirection).toBe('down') // Octave 5 notes are above middle line -> stems down
    expect(groups[0].secondarySegments.length).toBeGreaterThan(0)
  })

  it('groups 3 eighth notes in a triplet into a single beam group', () => {
    const t1 = createEighth('t1', 'D', 4)
    t1.tuplet = { count: 1, total: 3 }
    const t2 = createEighth('t2', 'E', 4)
    t2.tuplet = { count: 2, total: 3 }
    const t3 = createEighth('t3', 'F', 4)
    t3.tuplet = { count: 3, total: 3 }

    const positionedNotes: PositionedNote[] = [
      { note: t1, x: 50 },
      { note: t2, x: 80 },
      { note: t3, x: 110 },
    ]

    const groups = findBeamGroups(positionedNotes, {
      baseY: 60,
    })

    expect(groups).toHaveLength(1)
    expect(groups[0].notes).toHaveLength(3)
  })
})
