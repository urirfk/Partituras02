import type { Measure } from '../../types/music'
import type { MeasuresPerSystem } from '../../types/scoreConfig'
import {
  calculateMeasureNotePositions,
  PositionedNote,
} from './measureSpacing'

export interface LayoutedMeasure {
  measure: Measure
  startX: number
  width: number
  isFirstInSystem: boolean
  positionedNotes: PositionedNote[]
  positionedLowerNotes?: PositionedNote[]
}

export interface SystemLayout {
  systemIndex: number
  startMeasureNumber: number
  startX: number
  width: number
  measures: LayoutedMeasure[]
}

export interface PartitioningOptions {
  measuresPerSystem?: MeasuresPerSystem
  systemWidth?: number
  leftMargin?: number
  clefAreaWidth?: number
  minNoteDistance?: number
}

/**
 * Partitions an array of measures into discrete systems of N measures per line,
 * enforcing low density (default 2 bars per system) as requested in the specification.
 */
export function partitionMeasuresIntoSystems(
  measures: Measure[],
  options: PartitioningOptions = {},
): SystemLayout[] {
  if (!measures || measures.length === 0) {
    return []
  }

  const {
    measuresPerSystem = 2,
    systemWidth = 840,
    leftMargin = 50, // Space for clef, key signature and measure number
    minNoteDistance = 38,
  } = options

  const systems: SystemLayout[] = []
  const totalMeasures = measures.length

  for (let i = 0; i < totalMeasures; i += measuresPerSystem) {
    const chunk = measures.slice(i, i + measuresPerSystem)
    const systemIndex = Math.floor(i / measuresPerSystem)
    const startMeasureNumber = chunk[0].number

    // Usable width for musical measures after the clef/key signature header
    const usableWidth = systemWidth - leftMargin
    const measureWidth = usableWidth / chunk.length

    const layoutedMeasures: LayoutedMeasure[] = chunk.map((measure, idx) => {
      const isFirst = idx === 0
      const startX = leftMargin + idx * measureWidth

      // Calculate upper notes positions
      const relativeNotes = calculateMeasureNotePositions(measure.notes, {
        measureWidth,
        startPadding: isFirst ? 20 : 25,
        endPadding: 20,
        minNoteDistance,
      })

      // Convert relative note X to absolute system X
      const positionedNotes = relativeNotes.map((pn) => ({
        note: pn.note,
        x: startX + pn.x,
      }))

      // Calculate lower notes if present (grand staff)
      let positionedLowerNotes: PositionedNote[] | undefined
      if (measure.lowerNotes && measure.lowerNotes.length > 0) {
        const relativeLower = calculateMeasureNotePositions(measure.lowerNotes, {
          measureWidth,
          startPadding: isFirst ? 20 : 25,
          endPadding: 20,
          minNoteDistance,
        })
        positionedLowerNotes = relativeLower.map((pn) => ({
          note: pn.note,
          x: startX + pn.x,
        }))
      }

      return {
        measure,
        startX,
        width: measureWidth,
        isFirstInSystem: isFirst,
        positionedNotes,
        positionedLowerNotes,
      }
    })

    systems.push({
      systemIndex,
      startMeasureNumber,
      startX: 0,
      width: systemWidth,
      measures: layoutedMeasures,
    })
  }

  return systems
}
