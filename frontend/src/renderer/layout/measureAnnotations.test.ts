import { describe, it, expect } from 'vitest'
import {
  findTupletGroups,
  calculateChordPositions,
} from './measureAnnotations'
import type { Measure, Note, ChordSymbol } from '../../types/music'
import type { LayoutedMeasure } from './systemPartitioning'

describe('measureAnnotations Layout Helpers', () => {
  const dummyNotes: Note[] = [
    {
      id: 'n1',
      pitch: { step: 'C', octave: 4, accidental: 'natural', solfege: 'do', displayBadgeText: 'do' },
      duration: 'eighth',
      dots: 0,
      isRest: false,
      tuplet: { count: 1, total: 3 },
    },
    {
      id: 'n2',
      pitch: { step: 'D', octave: 4, accidental: 'natural', solfege: 're', displayBadgeText: 're' },
      duration: 'eighth',
      dots: 0,
      isRest: false,
      tuplet: { count: 2, total: 3 },
    },
    {
      id: 'n3',
      pitch: { step: 'E', octave: 4, accidental: 'natural', solfege: 'mi', displayBadgeText: 'mi' },
      duration: 'eighth',
      dots: 0,
      isRest: false,
      tuplet: { count: 3, total: 3 },
    },
  ]

  const positionedNotes = [
    { note: dummyNotes[0], x: 100 },
    { note: dummyNotes[1], x: 140 },
    { note: dummyNotes[2], x: 180 },
  ]

  describe('findTupletGroups', () => {
    it('returns empty array if no notes or no tuplets', () => {
      expect(findTupletGroups([])).toEqual([])
      expect(
        findTupletGroups([
          {
            note: {
              id: 'n-no-tuplet',
              isRest: false,
              duration: 'quarter',
              dots: 0,
            },
            x: 50,
          },
        ]),
      ).toEqual([])
    })

    it('identifies an eighth note triplet group correctly', () => {
      const tuplets = findTupletGroups(positionedNotes, { baseY: 60 })
      expect(tuplets).toHaveLength(1)
      expect(tuplets[0].number).toBe(3)
      expect(tuplets[0].startX).toBe(90) // 100 - 10
      expect(tuplets[0].endX).toBe(190) // 180 + 10
      expect(tuplets[0].y).toBeLessThan(60) // positioned above staff lines
    })
  })

  describe('calculateChordPositions', () => {
    const dummyMeasure: Measure = {
      number: 34,
      chords: [],
      notes: dummyNotes,
      timeSignature: { beats: 4, beatType: 4 },
    }

    const layoutedMeasure: LayoutedMeasure = {
      measure: dummyMeasure,
      startX: 80,
      width: 350,
      isFirstInSystem: true,
      positionedNotes,
    }

    it('calculates chord X matching note beat', () => {
      const chords: ChordSymbol[] = [
        { id: 'c1', root: 'Si', quality: '7', fullText: 'Si♭7', beat: 1 },
      ]

      const positions = calculateChordPositions(chords, layoutedMeasure, { baseY: 60 })
      expect(positions).toHaveLength(1)
      expect(positions[0].chord.fullText).toBe('Si♭7')
      expect(positions[0].x).toBe(100) // aligned with note 1 at x: 100
      expect(positions[0].y).toBe(34) // 60 - 26
    })

    it('shifts chord Y upward when directly over a high tuplet bracket', () => {
      const chords: ChordSymbol[] = [
        { id: 'c1', root: 'Do', quality: 'm', fullText: 'Dom', beat: 1 },
      ]
      const tupletGroups = [
        {
          id: 't1',
          startX: 80,
          endX: 180,
          y: 40,
          number: 3,
        },
      ]

      const positions = calculateChordPositions(
        chords,
        layoutedMeasure,
        { baseY: 60 },
        tupletGroups,
      )
      expect(positions).toHaveLength(1)
      expect(positions[0].y).toBeLessThan(40) // Raised above tuplet bracket
    })
  })
})
