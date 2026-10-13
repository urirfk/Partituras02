import type { ChordSymbol } from '../../types/music'
import type { Clef } from '../svg/pitchCoordinates'
import { getNoteY, getDiatonicIndex } from '../svg/pitchCoordinates'
import type { PositionedNote } from './measureSpacing'
import { getDurationWeight } from './measureSpacing'
import type { LayoutedMeasure } from './systemPartitioning'

export interface PositionedTuplet {
  id: string
  startX: number
  endX: number
  y: number
  number: number
}

export interface PositionedChord {
  chord: ChordSymbol
  x: number
  y: number
}

export interface AnnotationOptions {
  clef?: Clef
  baseY?: number
  lineSpacing?: number
  showFingerings?: boolean
}

/**
 * Detects tuplet note runs in a measure and computes exact bracket geometry.
 */
export function findTupletGroups(
  positionedNotes: PositionedNote[],
  options: AnnotationOptions = {},
): PositionedTuplet[] {
  if (!positionedNotes || positionedNotes.length === 0) {
    return []
  }

  const {
    clef = 'treble',
    baseY = 60,
    lineSpacing = 10,
    showFingerings = true,
  } = options

  const groups: PositionedTuplet[] = []
  let currentRun: PositionedNote[] = []

  const finalizeGroup = (run: PositionedNote[]) => {
    if (run.length < 2) return
    const first = run[0]
    const last = run[run.length - 1]
    const tupletNumber = run[0].note.tuplet?.total || run.length

    // Compute highest point among the notes in the run
    let minTopY = baseY - 14
    for (const pn of run) {
      if (pn.note.pitch && !pn.note.isRest) {
        const noteY = getNoteY(pn.note.pitch, clef, baseY, lineSpacing)
        const diatonicIndex = getDiatonicIndex(pn.note.pitch.step, pn.note.pitch.octave, clef)
        const stemDir = diatonicIndex < 4 ? 'up' : 'down'
        const stemEndY = stemDir === 'up' ? noteY - 35 : noteY + 35
        let noteTop = Math.min(noteY, stemEndY)
        if (showFingerings && pn.note.fingering) {
          noteTop -= 10
        }
        if (noteTop < minTopY) {
          minTopY = noteTop
        }
      }
    }

    const bracketY = Math.min(baseY - 14, minTopY - 6)

    groups.push({
      id: `tuplet-${first.note.id}-${last.note.id}`,
      startX: first.x - 10,
      endX: last.x + 10,
      y: bracketY,
      number: tupletNumber,
    })
  }

  for (let i = 0; i < positionedNotes.length; i++) {
    const pn = positionedNotes[i]
    if (pn.note.tuplet) {
      currentRun.push(pn)
      if (
        pn.note.tuplet.count === pn.note.tuplet.total ||
        currentRun.length === pn.note.tuplet.total
      ) {
        finalizeGroup(currentRun)
        currentRun = []
      }
    } else {
      if (currentRun.length >= 2) {
        finalizeGroup(currentRun)
      }
      currentRun = []
    }
  }

  if (currentRun.length >= 2) {
    finalizeGroup(currentRun)
  }

  return groups
}

/**
 * Calculates horizontal (X) and vertical (Y) coordinates for chords in a measure.
 */
export function calculateChordPositions(
  chords: ChordSymbol[],
  layoutedMeasure: LayoutedMeasure,
  options: AnnotationOptions = {},
  tupletGroups: PositionedTuplet[] = [],
): PositionedChord[] {
  if (!chords || chords.length === 0) {
    return []
  }

  const { baseY = 60 } = options
  const { measure, startX, width, positionedNotes } = layoutedMeasure
  const beats = measure.timeSignature?.beats || 4

  return chords.map((chord) => {
    // Determine horizontal X coordinate
    let chordX: number | undefined

    if (positionedNotes && positionedNotes.length > 0) {
      let accumulatedBeat = 1.0
      for (const pn of positionedNotes) {
        if (Math.abs(accumulatedBeat - chord.beat) < 0.25) {
          chordX = pn.x
          break
        }
        accumulatedBeat += getDurationWeight(pn.note.duration, pn.note.dots)
      }
    }

    if (chordX === undefined) {
      const fraction = Math.max(0, Math.min(1, (chord.beat - 1) / beats))
      chordX = startX + 20 + fraction * (width - 40)
    }

    // Determine vertical Y baseline above staff
    let chordY = baseY - 26

    // Avoid collision if there's a tuplet bracket directly underneath this chord
    for (const tg of tupletGroups) {
      if (chordX >= tg.startX - 15 && chordX <= tg.endX + 15) {
        if (chordY >= tg.y - 12) {
          chordY = tg.y - 14
        }
      }
    }

    return {
      chord,
      x: chordX,
      y: chordY,
    }
  })
}
