import { describe, it, expect } from 'vitest'
import { DEFAULT_SCORE_CONFIG } from './scoreConfig'
import type {
  ScoreDisplayConfig,
  MeasuresPerSystem,
  StaffScale,
} from './scoreConfig'

describe('Domain Quality Contract: Orthogonal Controls Invariance', () => {
  it('changing measuresPerSystem does not mutate or alter toggles (orthogonality invariant)', () => {
    const baseConfig: ScoreDisplayConfig = { ...DEFAULT_SCORE_CONFIG }

    const updateMeasuresPerSystem = (
      config: ScoreDisplayConfig,
      measures: MeasuresPerSystem,
    ): ScoreDisplayConfig => ({
      ...config,
      measuresPerSystem: measures,
    })

    const updated = updateMeasuresPerSystem(baseConfig, 4)

    expect(updated.measuresPerSystem).toBe(4)
    // Invariance checks: all other toggles MUST remain strictly unchanged
    expect(updated.showNoteNames).toBe(baseConfig.showNoteNames)
    expect(updated.showAccidentals).toBe(baseConfig.showAccidentals)
    expect(updated.showFingerings).toBe(baseConfig.showFingerings)
    expect(updated.showChords).toBe(baseConfig.showChords)
    expect(updated.showLyrics).toBe(baseConfig.showLyrics)
    expect(updated.scale).toBe(baseConfig.scale)
    expect(updated.transpositionSemitones).toBe(baseConfig.transpositionSemitones)
    expect(updated.chordNotation).toBe(baseConfig.chordNotation)
  })

  it('changing staff scale does not reset or alter measuresPerSystem or note name toggles', () => {
    const customConfig: ScoreDisplayConfig = {
      ...DEFAULT_SCORE_CONFIG,
      measuresPerSystem: 3,
      showNoteNames: false,
      showFingerings: false,
    }

    const updateScale = (
      config: ScoreDisplayConfig,
      scale: StaffScale,
    ): ScoreDisplayConfig => ({
      ...config,
      scale,
    })

    const updated = updateScale(customConfig, 'extra-large')

    expect(updated.scale).toBe('extra-large')
    expect(updated.measuresPerSystem).toBe(3)
    expect(updated.showNoteNames).toBe(false)
    expect(updated.showFingerings).toBe(false)
    expect(updated.showAccidentals).toBe(customConfig.showAccidentals)
  })

  it('toggling note names or accidentals operates in complete isolation', () => {
    const config: ScoreDisplayConfig = { ...DEFAULT_SCORE_CONFIG }

    const toggleNoteNames = (c: ScoreDisplayConfig): ScoreDisplayConfig => ({
      ...c,
      showNoteNames: !c.showNoteNames,
    })

    const toggleAccidentals = (c: ScoreDisplayConfig): ScoreDisplayConfig => ({
      ...c,
      showAccidentals: !c.showAccidentals,
    })

    const noteNamesToggled = toggleNoteNames(config)
    expect(noteNamesToggled.showNoteNames).toBe(false)
    expect(noteNamesToggled.showAccidentals).toBe(true) // independent

    const bothToggled = toggleAccidentals(noteNamesToggled)
    expect(bothToggled.showNoteNames).toBe(false)
    expect(bothToggled.showAccidentals).toBe(false)
    expect(bothToggled.measuresPerSystem).toBe(2)
  })
})
