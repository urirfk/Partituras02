import type { DurationType, Note } from '../../types/music'

const DURATION_WEIGHTS: Record<DurationType, number> = {
  whole: 4.0,
  half: 2.0,
  quarter: 1.0,
  eighth: 0.5,
  '16th': 0.25,
  '32nd': 0.125,
}

export function getDurationWeight(duration: DurationType, dots: number = 0): number {
  const baseWeight = DURATION_WEIGHTS[duration] || 1.0
  if (dots === 1) return baseWeight * 1.5
  if (dots === 2) return baseWeight * 1.75
  return baseWeight
}

export interface PositionedNote {
  note: Note
  x: number // Relative to measure origin
}

export interface MeasureSpacingOptions {
  measureWidth: number
  startPadding?: number
  endPadding?: number
  minNoteDistance?: number
}

/**
 * Calculates relaxed horizontal coordinates (X) for notes within a measure,
 * guaranteeing no visual crowding or pill collisions (anti-apelotonamiento).
 */
export function calculateMeasureNotePositions(
  notes: Note[],
  options: MeasureSpacingOptions,
): PositionedNote[] {
  if (!notes || notes.length === 0) {
    return []
  }

  const {
    measureWidth,
    startPadding = 35,
    endPadding = 25,
    minNoteDistance = 38,
  } = options

  if (notes.length === 1) {
    return [
      {
        note: notes[0],
        x: startPadding + (measureWidth - startPadding - endPadding) / 2,
      },
    ]
  }

  const availableWidth = Math.max(
    measureWidth - startPadding - endPadding,
    (notes.length - 1) * minNoteDistance,
  )

  // Calculate weights based on musical duration
  const weights = notes.map((n) => getDurationWeight(n.duration, n.dots))
  const totalWeight = weights.reduce((sum, w) => sum + w, 0)

  // Compute raw proportional positions
  const rawPositions: number[] = [0]
  let currentAccumulatedWeight = 0

  for (let i = 0; i < notes.length - 1; i++) {
    currentAccumulatedWeight += weights[i]
    const proportion = currentAccumulatedWeight / totalWeight
    rawPositions.push(proportion * availableWidth)
  }

  // Enforce minimum note distance iteratively to prevent any capsule crowding
  const adjustedPositions = [...rawPositions]
  for (let i = 1; i < adjustedPositions.length; i++) {
    const minRequiredX = adjustedPositions[i - 1] + minNoteDistance
    if (adjustedPositions[i] < minRequiredX) {
      adjustedPositions[i] = minRequiredX
    }
  }

  // Rescale if minimum distance pushed the last note past availableWidth
  const lastX = adjustedPositions[adjustedPositions.length - 1]
  const scale = lastX > availableWidth ? availableWidth / lastX : 1.0

  return notes.map((note, index) => ({
    note,
    x: startPadding + adjustedPositions[index] * scale,
  }))
}

export interface GrandStaffPositionedNotes {
  upper: PositionedNote[]
  lower: PositionedNote[]
}

/**
 * Calculates vertically synchronized horizontal coordinates for notes on a Grand Staff,
 * guaranteeing that concurrent pulses across both hands share identical X coordinates.
 */
export function calculateGrandStaffNotePositions(
  upperNotes: Note[],
  lowerNotes: Note[],
  options: MeasureSpacingOptions,
): GrandStaffPositionedNotes {
  if (!lowerNotes || lowerNotes.length === 0) {
    return {
      upper: calculateMeasureNotePositions(upperNotes, options),
      lower: [],
    }
  }

  if (!upperNotes || upperNotes.length === 0) {
    return {
      upper: [],
      lower: calculateMeasureNotePositions(lowerNotes, options),
    }
  }

  const {
    measureWidth,
    startPadding = 35,
    endPadding = 25,
    minNoteDistance = 38,
  } = options

  // Map each note to its onset time within the measure
  interface TimedNote {
    note: Note
    onset: number
    weight: number
  }

  const getTimed = (notes: Note[]): TimedNote[] => {
    let onset = 0
    return notes.map((note) => {
      const weight = getDurationWeight(note.duration, note.dots)
      const timed = { note, onset, weight }
      onset += weight
      return timed
    })
  }

  const upperTimed = getTimed(upperNotes)
  const lowerTimed = getTimed(lowerNotes)

  // Collect and sort unique onsets across both hands
  const uniqueOnsets = Array.from(
    new Set([...upperTimed.map((t) => t.onset), ...lowerTimed.map((t) => t.onset)]),
  ).sort((a, b) => a - b)

  if (uniqueOnsets.length === 1) {
    const singleX = startPadding + (measureWidth - startPadding - endPadding) / 2
    return {
      upper: upperTimed.map((t) => ({ note: t.note, x: singleX })),
      lower: lowerTimed.map((t) => ({ note: t.note, x: singleX })),
    }
  }

  const availableWidth = Math.max(
    measureWidth - startPadding - endPadding,
    (uniqueOnsets.length - 1) * minNoteDistance,
  )

  // Find max measure length in beats
  const maxOnset = uniqueOnsets[uniqueOnsets.length - 1]
  const upperTotal = upperTimed.reduce((sum, t) => sum + t.weight, 0)
  const lowerTotal = lowerTimed.reduce((sum, t) => sum + t.weight, 0)
  const measureSpan = Math.max(maxOnset, upperTotal, lowerTotal)

  // Raw proportional positions for each onset
  const rawPositions = uniqueOnsets.map((onset) =>
    measureSpan > 0 ? (onset / measureSpan) * availableWidth : 0,
  )

  // Enforce minimum note distance
  const adjustedPositions = [...rawPositions]
  for (let i = 1; i < adjustedPositions.length; i++) {
    const minRequiredX = adjustedPositions[i - 1] + minNoteDistance
    if (adjustedPositions[i] < minRequiredX) {
      adjustedPositions[i] = minRequiredX
    }
  }

  // Rescale if required
  const lastX = adjustedPositions[adjustedPositions.length - 1]
  const scale = lastX > availableWidth ? availableWidth / lastX : 1.0

  const onsetToX = new Map<number, number>()
  uniqueOnsets.forEach((onset, idx) => {
    onsetToX.set(onset, startPadding + adjustedPositions[idx] * scale)
  })

  return {
    upper: upperTimed.map((t) => ({ note: t.note, x: onsetToX.get(t.onset) ?? startPadding })),
    lower: lowerTimed.map((t) => ({ note: t.note, x: onsetToX.get(t.onset) ?? startPadding })),
  }
}

