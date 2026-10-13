import type { Pitch, Step } from '../../types/music'

export type Clef = 'treble' | 'bass'

const STEP_DIATONIC_ORDER: Record<Step, number> = {
  C: 0,
  D: 1,
  E: 2,
  F: 3,
  G: 4,
  A: 5,
  B: 6,
}

/**
 * Calculates diatonic index relative to bottom line of the clef:
 * For Treble clef, bottom line is E4 (index 0). Top line is F5 (index 8).
 * For Bass clef, bottom line is G2 (index 0). Top line is A3 (index 8).
 */
export function getDiatonicIndex(step: Step, octave: number, clef: Clef = 'treble'): number {
  const absoluteDiatonic = octave * 7 + STEP_DIATONIC_ORDER[step]

  if (clef === 'treble') {
    // E4 is octave 4, step E -> 4 * 7 + 2 = 30
    const trebleE4 = 4 * 7 + STEP_DIATONIC_ORDER['E']
    return absoluteDiatonic - trebleE4
  } else {
    // G2 is octave 2, step G -> 2 * 7 + 4 = 18
    const bassG2 = 2 * 7 + STEP_DIATONIC_ORDER['G']
    return absoluteDiatonic - bassG2
  }
}

/**
 * Calculates note Y coordinate on staff.
 * baseY is the top line of the 5-line staff.
 * lineSpacing is distance between adjacent staff lines (e.g. 10px).
 * A diatonic step is half a line spacing (5px).
 */
export function getNoteY(
  pitch: Pitch,
  clef: Clef,
  baseY: number,
  lineSpacing: number,
): number {
  const diatonicIndex = getDiatonicIndex(pitch.step, pitch.octave, clef)
  const bottomLineY = baseY + 4 * lineSpacing
  const stepHeight = lineSpacing / 2

  // Each positive diatonic index moves upwards (-Y)
  return bottomLineY - diatonicIndex * stepHeight
}

/**
 * Computes ledger line Y coordinates for notes outside the 5 staff lines.
 * Notes below bottom line (index < 0) or above top line (index > 8).
 * Ledger lines are placed on even diatonic indices outside [0, 8]:
 * e.g. -2, -4... or 10, 12...
 */
export function getLedgerLineYCoordinates(
  pitch: Pitch,
  clef: Clef,
  baseY: number,
  lineSpacing: number,
): number[] {
  const diatonicIndex = getDiatonicIndex(pitch.step, pitch.octave, clef)
  const bottomLineY = baseY + 4 * lineSpacing
  const stepHeight = lineSpacing / 2
  const ledgerYs: number[] = []

  // Below staff: e.g. index = -2 (Middle C in treble) -> ledger line at index -2
  if (diatonicIndex <= -2) {
    for (let i = -2; i >= diatonicIndex; i -= 2) {
      ledgerYs.push(bottomLineY - i * stepHeight)
    }
  }

  // Above staff: e.g. index = 10 (A5 in treble) -> ledger line at index 10
  if (diatonicIndex >= 10) {
    for (let i = 10; i <= diatonicIndex; i += 2) {
      ledgerYs.push(bottomLineY - i * stepHeight)
    }
  }

  return ledgerYs
}
