import { describe, it, expect } from 'vitest'
import { Score, DEFAULT_SCORE_CONFIG } from './scoreConfig'
import type { Measure } from './music'

describe('Music Domain Types', () => {
  it('instantiates a valid didactic Score model adhering to ejemplo01.png specifications', () => {
    const measure34: Measure = {
      number: 34,
      chords: [
        { id: 'c1', root: 'Si', quality: 'b', fullText: 'Si♭', beat: 1 },
        { id: 'c2', root: 'Si', quality: 'b7', fullText: 'Si♭7', beat: 3 },
      ],
      notes: [
        {
          id: 'n1',
          pitch: {
            step: 'E',
            octave: 4,
            accidental: 'flat',
            solfege: 'mi',
            displayBadgeText: 'mi',
          },
          duration: 'quarter',
          dots: 0,
          isRest: false,
          fingering: 3,
        },
        {
          id: 'n2',
          pitch: {
            step: 'D',
            octave: 4,
            accidental: 'natural',
            solfege: 're',
            displayBadgeText: 're',
          },
          duration: 'quarter',
          dots: 1,
          isRest: false,
          fingering: 2,
        },
      ],
    }

    expect(measure34.number).toBe(34)
    expect(measure34.notes[0].pitch?.solfege).toBe('mi')
    expect(measure34.notes[0].fingering).toBe(3)
    expect(measure34.chords[0].fullText).toBe('Si♭')
    expect(DEFAULT_SCORE_CONFIG.measuresPerSystem).toBe(2)
    expect(DEFAULT_SCORE_CONFIG.showNoteNames).toBe(true)
  })
})
