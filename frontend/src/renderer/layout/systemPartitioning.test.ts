import { describe, it, expect } from 'vitest'
import { partitionMeasuresIntoSystems } from './systemPartitioning'
import type { Measure } from '../../types/music'

describe('System Partitioning Algorithm', () => {
  const createDummyMeasure = (num: number): Measure => ({
    number: num,
    chords: [],
    notes: [
      {
        id: `m${num}-n1`,
        duration: 'quarter',
        dots: 0,
        isRest: false,
      },
      {
        id: `m${num}-n2`,
        duration: 'quarter',
        dots: 0,
        isRest: false,
      },
    ],
  })

  it('partitions 6 measures into exactly 3 systems of 2 measures each (default 2 bars per line)', () => {
    // Measures 34, 35, 36, 37, 38, 39
    const measures = [34, 35, 36, 37, 38, 39].map(createDummyMeasure)

    const systems = partitionMeasuresIntoSystems(measures, {
      measuresPerSystem: 2,
      systemWidth: 800,
    })

    expect(systems.length).toBe(3)

    // First system: measures 34 & 35
    expect(systems[0].startMeasureNumber).toBe(34)
    expect(systems[0].measures.length).toBe(2)
    expect(systems[0].measures[0].measure.number).toBe(34)
    expect(systems[0].measures[1].measure.number).toBe(35)

    // Second system: measures 36 & 37
    expect(systems[1].startMeasureNumber).toBe(36)
    expect(systems[1].measures.length).toBe(2)
    expect(systems[1].measures[0].measure.number).toBe(36)
    expect(systems[1].measures[1].measure.number).toBe(37)

    // Third system: measures 38 & 39
    expect(systems[2].startMeasureNumber).toBe(38)
    expect(systems[2].measures.length).toBe(2)
    expect(systems[2].measures[0].measure.number).toBe(38)
    expect(systems[2].measures[1].measure.number).toBe(39)
  })

  it('correctly adapts when user selects 3 or 4 measures per line', () => {
    const measures = [1, 2, 3, 4, 5, 6].map(createDummyMeasure)

    // 3 measures per line -> 2 systems
    const systems3 = partitionMeasuresIntoSystems(measures, { measuresPerSystem: 3 })
    expect(systems3.length).toBe(2)
    expect(systems3[0].measures.length).toBe(3)
    expect(systems3[1].measures.length).toBe(3)

    // 4 measures per line -> 2 systems (4 in first, 2 in second)
    const systems4 = partitionMeasuresIntoSystems(measures, { measuresPerSystem: 4 })
    expect(systems4.length).toBe(2)
    expect(systems4[0].measures.length).toBe(4)
    expect(systems4[1].measures.length).toBe(2)
  })

  it('guarantees that note X coordinates in measure 2 are strictly greater than in measure 1', () => {
    const measures = [34, 35].map(createDummyMeasure)
    const systems = partitionMeasuresIntoSystems(measures, {
      measuresPerSystem: 2,
      systemWidth: 800,
      leftMargin: 60,
    })

    const m1Notes = systems[0].measures[0].positionedNotes
    const m2Notes = systems[0].measures[1].positionedNotes

    expect(m1Notes.length).toBe(2)
    expect(m2Notes.length).toBe(2)

    // All notes in m2 must be to the right of notes in m1
    const maxM1X = Math.max(...m1Notes.map((n) => n.x))
    const minM2X = Math.min(...m2Notes.map((n) => n.x))
    expect(minM2X).toBeGreaterThan(maxM1X)
  })
})
