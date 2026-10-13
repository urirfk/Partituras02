import { describe, it, expect } from 'vitest'
import {
  calculateMeasureNotePositions,
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
})
