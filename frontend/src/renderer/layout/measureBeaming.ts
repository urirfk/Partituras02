import type { Note, Pitch, TimeSignature } from '../../types/music'
import type { PositionedNote } from './measureSpacing'
import { getDurationWeight } from './measureSpacing'
import { Clef, getDiatonicIndex, getNoteY } from '../svg/pitchCoordinates'

export interface BeamedNoteInfo {
  note: Note
  x: number
  stemX: number
  stemEndY: number
  noteY: number
  diatonicIndex: number
}

export interface SecondaryBeamSegment {
  startX: number
  endX: number
  startY: number
  endY: number
}

export interface BeamGroup {
  id: string
  notes: BeamedNoteInfo[]
  stemDirection: 'up' | 'down'
  startX: number
  endX: number
  startY: number
  endY: number
  secondarySegments: SecondaryBeamSegment[]
}

export interface BeamingOptions {
  clef?: Clef
  baseY: number
  lineSpacing?: number
  showNoteNames?: boolean
  showAccidentals?: boolean
  isCompact?: boolean
  timeSignature?: TimeSignature
}

/**
 * Identifies groups of adjacent beamable notes (eighth, 16th, 32nd) within a measure,
 * determines uniform stem directions, and computes precise stem end and beam bar coordinates.
 */
export function findBeamGroups(
  positionedNotes: PositionedNote[],
  options: BeamingOptions,
): BeamGroup[] {
  if (!positionedNotes || positionedNotes.length < 2) {
    return []
  }

  const {
    clef = 'treble',
    baseY,
    lineSpacing = 10,
    showNoteNames = true,
    showAccidentals = true,
    isCompact = false,
    timeSignature,
  } = options

  // Metric grouping unit: 1.5 beats for 6/8, otherwise 1.0 (quarter note beat)
  const isCompound68 = timeSignature?.beats === 6 && timeSignature?.beatType === 8
  const beatUnit = isCompound68 ? 1.5 : 1.0

  // Calculate onset times for all notes
  let accumulatedOnset = 0
  const timedNotes = positionedNotes.map((pn) => {
    const weight = getDurationWeight(pn.note.duration, pn.note.dots)
    const onset = accumulatedOnset
    accumulatedOnset += weight
    return {
      pn,
      onset,
      weight,
      isBeamable:
        !pn.note.isRest &&
        (pn.note.duration === 'eighth' ||
          pn.note.duration === '16th' ||
          pn.note.duration === '32nd'),
    }
  })

  // Partition into candidate groups based on beat boundaries, tuplet membership, and non-rest continuity
  const rawGroups: typeof timedNotes[] = []
  let currentGroup: typeof timedNotes = []
  let currentBeatIndex = -1
  let currentTupletTotal = -1

  for (const item of timedNotes) {
    if (!item.isBeamable) {
      if (currentGroup.length > 0) {
        rawGroups.push(currentGroup)
        currentGroup = []
      }
      currentBeatIndex = -1
      currentTupletTotal = -1
      continue
    }

    const noteBeat = Math.floor(item.onset / beatUnit + 1e-4)
    const tupletTotal = item.pn.note.tuplet?.total ?? -1

    const isSameTuplet = tupletTotal > 0 && tupletTotal === currentTupletTotal
    const isSameBeat = tupletTotal < 0 && noteBeat === currentBeatIndex

    if (currentGroup.length === 0 || isSameTuplet || isSameBeat) {
      currentGroup.push(item)
      currentBeatIndex = noteBeat
      currentTupletTotal = tupletTotal
    } else {
      rawGroups.push(currentGroup)
      currentGroup = [item]
      currentBeatIndex = noteBeat
      currentTupletTotal = tupletTotal
    }
  }

  if (currentGroup.length > 0) {
    rawGroups.push(currentGroup)
  }

  // Filter groups with at least 2 notes
  const validGroups = rawGroups.filter((g) => g.length >= 2)

  // Construct BeamGroup objects with calculated stem and bar geometries
  return validGroups.map((group, groupIdx) => {
    const groupNotes = group.map((item) => item.pn)

    // Calculate note geometry (Y, diatonic index, stem X)
    const analyzedNotes = groupNotes.map((pn) => {
      const pitch = pn.note.pitch as Pitch
      const noteY = getNoteY(pitch, clef, baseY, lineSpacing)
      const diatonicIndex = getDiatonicIndex(pitch.step, pitch.octave, clef)

      const hasLongName =
        showNoteNames &&
        pitch.solfege &&
        (showAccidentals && pitch.accidental !== 'natural' ? 3 : 2) >= 3

      const halfCapsuleWidth = showNoteNames
        ? isCompact
          ? hasLongName
            ? 12
            : 9.5
          : hasLongName
          ? 16
          : 13
        : 6.5

      return {
        note: pn.note,
        x: pn.x,
        noteY,
        diatonicIndex,
        halfCapsuleWidth,
      }
    })

    // Determine uniform stem direction for the entire group:
    // Middle line in staff is diatonicIndex = 4.
    const avgDiatonic =
      analyzedNotes.reduce((sum, n) => sum + n.diatonicIndex, 0) / analyzedNotes.length
    const stemDirection: 'up' | 'down' = avgDiatonic < 4 ? 'up' : 'down'

    // Compute stem X for each note
    const notesWithStemX = analyzedNotes.map((n) => ({
      ...n,
      stemX: stemDirection === 'up' ? n.x + n.halfCapsuleWidth : n.x - n.halfCapsuleWidth,
    }))

    const firstNote = notesWithStemX[0]
    const lastNote = notesWithStemX[notesWithStemX.length - 1]
    const dx = lastNote.stemX - firstNote.stemX

    // Melodic slope (clamped between -0.22 and +0.22 for clean pedagogical reading)
    const rawSlope = dx > 0 ? (lastNote.noteY - firstNote.noteY) / dx : 0
    const slope = Math.max(-0.22, Math.min(0.22, rawSlope))

    // Minimum stem height is 30px
    const minStemHeight = 30
    let y0: number

    if (stemDirection === 'up') {
      // All stem ends must be at most noteY - minStemHeight
      y0 = Math.min(
        ...notesWithStemX.map((n) => n.noteY - minStemHeight - slope * (n.stemX - firstNote.stemX)),
      )
    } else {
      // All stem ends must be at least noteY + minStemHeight
      y0 = Math.max(
        ...notesWithStemX.map((n) => n.noteY + minStemHeight - slope * (n.stemX - firstNote.stemX)),
      )
    }

    const startX = firstNote.stemX
    const endX = lastNote.stemX
    const startY = y0
    const endY = y0 + slope * (endX - startX)

    // Compute stemEndY for each note
    const beamedNotes: BeamedNoteInfo[] = notesWithStemX.map((n) => {
      const stemEndY = y0 + slope * (n.stemX - startX)
      return {
        note: n.note,
        x: n.x,
        stemX: n.stemX,
        stemEndY,
        noteY: n.noteY,
        diatonicIndex: n.diatonicIndex,
      }
    })

    // Compute secondary beam segments for 16th and 32nd notes
    const secondaryOffset = stemDirection === 'up' ? 5 : -5
    const secondarySegments: SecondaryBeamSegment[] = []

    for (let i = 0; i < beamedNotes.length; i++) {
      const current = beamedNotes[i]
      const isSubBeamed = current.note.duration === '16th' || current.note.duration === '32nd'

      if (!isSubBeamed) continue

      const next = beamedNotes[i + 1]
      const nextIsSub =
        next && (next.note.duration === '16th' || next.note.duration === '32nd')

      if (nextIsSub) {
        // Continuous secondary bar between consecutive 16th notes
        const sX = current.stemX
        const eX = next.stemX
        secondarySegments.push({
          startX: sX,
          endX: eX,
          startY: current.stemEndY + secondaryOffset,
          endY: next.stemEndY + secondaryOffset,
        })
      } else if (i > 0 && (beamedNotes[i - 1].note.duration === '16th' || beamedNotes[i - 1].note.duration === '32nd')) {
        // Already covered by previous segment
        continue
      } else {
        // Isolated 16th note in group: fractional beam stub (10px) toward the group
        const stubDir = i === 0 ? 1 : -1
        const sX = current.stemX
        const eX = current.stemX + stubDir * 10
        secondarySegments.push({
          startX: Math.min(sX, eX),
          endX: Math.max(sX, eX),
          startY: current.stemEndY + secondaryOffset,
          endY: (current.stemEndY + slope * (eX - sX)) + secondaryOffset,
        })
      }
    }

    return {
      id: `beam-${groupIdx}-${firstNote.note.id}`,
      notes: beamedNotes,
      stemDirection,
      startX,
      endX,
      startY,
      endY,
      secondarySegments,
    }
  })
}
