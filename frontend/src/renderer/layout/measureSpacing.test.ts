import { describe, it, expect } from 'vitest'
import {
  calculateMeasureNotePositions,
  calculateGrandStaffNotePositions,
  getDurationWeight,
} from './measureSpacing'
import type { Note } from '../../types/music'

describe('Measure Spacing Algorithm', () => {
  const createNote = (id: string, duration: Note['duration'], dots = 0): Note => ({
    id,
    duration,
    dots,
    isRest: false,
  })

  it('calculates duration weights correctly with augmentation dots', () => {
    expect(getDurationWeight('quarter', 0)).toBe(1.0)
    expect(getDurationWeight('quarter', 1)).toBe(1.5) // dotted quarter
    expect(getDurationWeight('eighth', 0)).toBe(0.5)
    expect(getDurationWeight('16th', 0)).toBe(0.25)
  })

  it('positions notes in strictly monotonically increasing order', () => {
    const notes: Note[] = [
      createNote('n1', 'quarter', 0),
      createNote('n2', 'eighth', 0),
      createNote('n3', 'eighth', 0),
      createNote('n4', 'half', 0),
    ]

    const positioned = calculateMeasureNotePositions(notes, {
      measureWidth: 400,
      startPadding: 30,
      endPadding: 20,
      minNoteDistance: 40,
    })

    expect(positioned.length).toBe(4)
    for (let i = 1; i < positioned.length; i++) {
      expect(positioned[i].x).toBeGreaterThan(positioned[i - 1].x)
    }
  })

  it('guarantees minimum distance between adjacent notes to prevent capsule collisions', () => {
    // 6 rapid sixteenth notes
    const rapidNotes: Note[] = [
      createNote('n1', '16th'),
      createNote('n2', '16th'),
      createNote('n3', '16th'),
      createNote('n4', '16th'),
      createNote('n5', '16th'),
      createNote('n6', '16th'),
    ]

    const minDistance = 38
    const positioned = calculateMeasureNotePositions(rapidNotes, {
      measureWidth: 350,
      minNoteDistance: minDistance,
    })

    for (let i = 1; i < positioned.length; i++) {
      const distance = positioned[i].x - positioned[i - 1].x
      expect(distance).toBeGreaterThanOrEqual(minDistance - 0.5)
    }
  })

  it('centers single-note measure cleanly within available space', () => {
    const singleWholeNote: Note[] = [createNote('n1', 'whole')]

    const positioned = calculateMeasureNotePositions(singleWholeNote, {
      measureWidth: 400,
      startPadding: 40,
      endPadding: 40,
    })

    expect(positioned.length).toBe(1)
    expect(positioned[0].x).toBe(200) // (400 - 40 - 40)/2 + 40 = 200
  })

  it('handles empty measures gracefully', () => {
    const positioned = calculateMeasureNotePositions([], { measureWidth: 400 })
    expect(positioned).toEqual([])
  })

  describe('Grand Staff Vertical Synchronization', () => {
    it('synchronizes concurrent pulses across upper and lower staves to identical X coordinates', () => {
      // Upper hand: 2 half notes (onsets: 0, 2.0)
      const upperNotes: Note[] = [
        createNote('u1', 'half'),
        createNote('u2', 'half'),
      ]
      // Lower hand: 4 quarter notes (onsets: 0, 1.0, 2.0, 3.0)
      const lowerNotes: Note[] = [
        createNote('l1', 'quarter'),
        createNote('l2', 'quarter'),
        createNote('l3', 'quarter'),
        createNote('l4', 'quarter'),
      ]

      const { upper, lower } = calculateGrandStaffNotePositions(
        upperNotes,
        lowerNotes,
        {
          measureWidth: 400,
          startPadding: 30,
          endPadding: 20,
          minNoteDistance: 35,
        },
      )

      expect(upper).toHaveLength(2)
      expect(lower).toHaveLength(4)

      // Pulse 1 (onset 0): u1 and l1 MUST share the exact same X
      expect(upper[0].x).toBe(lower[0].x)

      // Pulse 3 (onset 2.0): u2 and l3 MUST share the exact same X
      expect(upper[1].x).toBe(lower[2].x)

      // Intermediate notes l2 (onset 1.0) and l4 (onset 3.0) must maintain progression
      expect(lower[1].x).toBeGreaterThan(lower[0].x)
      expect(lower[2].x).toBeGreaterThan(lower[1].x)
      expect(lower[3].x).toBeGreaterThan(lower[2].x)
    })

    it('strictly guarantees that dense notes never exceed measureWidth - endPadding', () => {
      // 12 eighth notes in a 350px measure
      const denseNotes: Note[] = Array.from({ length: 12 }, (_, i) =>
        createNote(`n${i}`, 'eighth'),
      )
      const measureWidth = 350
      const startPadding = 30
      const endPadding = 20

      const positioned = calculateMeasureNotePositions(denseNotes, {
        measureWidth,
        startPadding,
        endPadding,
        minNoteDistance: 38,
      })

      expect(positioned).toHaveLength(12)
      for (const pn of positioned) {
        expect(pn.x).toBeGreaterThanOrEqual(startPadding)
        expect(pn.x).toBeLessThanOrEqual(measureWidth - endPadding + 0.001)
      }
    })

    it('strictly confines Grand Staff 16th notes within measure boundaries', () => {
      const upper16ths: Note[] = Array.from({ length: 16 }, (_, i) =>
        createNote(`u${i}`, '16th'),
      )
      const lower8ths: Note[] = Array.from({ length: 8 }, (_, i) =>
        createNote(`l${i}`, 'eighth'),
      )
      const measureWidth = 380
      const startPadding = 25
      const endPadding = 20

      const { upper, lower } = calculateGrandStaffNotePositions(
        upper16ths,
        lower8ths,
        {
          measureWidth,
          startPadding,
          endPadding,
          minNoteDistance: 35,
        },
      )

      expect(upper).toHaveLength(16)
      expect(lower).toHaveLength(8)

      for (const pn of upper) {
        expect(pn.x).toBeGreaterThanOrEqual(startPadding)
        expect(pn.x).toBeLessThanOrEqual(measureWidth - endPadding + 0.001)
      }
      for (const pn of lower) {
        expect(pn.x).toBeGreaterThanOrEqual(startPadding)
        expect(pn.x).toBeLessThanOrEqual(measureWidth - endPadding + 0.001)
      }
    })
  })
})


