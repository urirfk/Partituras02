import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { StaffLines, LedgerLines } from './StaffLines'
import {
  getDiatonicIndex,
  getNoteY,
  getLedgerLineYCoordinates,
} from './pitchCoordinates'
import type { Pitch } from '../../types/music'

describe('StaffLines & Pitch Coordinates', () => {
  it('renders exactly 5 parallel horizontal staff lines and barlines', () => {
    render(
      <svg>
        <StaffLines startX={0} endX={400} baseY={50} lineSpacing={10} clef="treble" />
      </svg>,
    )

    expect(screen.getByTestId('staff-lines-group')).toBeInTheDocument()
    expect(screen.getByTestId('staff-line-1')).toBeInTheDocument()
    expect(screen.getByTestId('staff-line-2')).toBeInTheDocument()
    expect(screen.getByTestId('staff-line-3')).toBeInTheDocument()
    expect(screen.getByTestId('staff-line-4')).toBeInTheDocument()
    expect(screen.getByTestId('staff-line-5')).toBeInTheDocument()
    expect(screen.getByTestId('start-barline')).toBeInTheDocument()
    expect(screen.getByTestId('end-barline')).toBeInTheDocument()
    expect(screen.getByTestId('clef-treble')).toBeInTheDocument()
  })

  it('calculates correct diatonic positions for treble clef', () => {
    // E4 is bottom line (index 0)
    expect(getDiatonicIndex('E', 4, 'treble')).toBe(0)
    // G4 is 2nd line (index 2)
    expect(getDiatonicIndex('G', 4, 'treble')).toBe(2)
    // B4 is 3rd line (index 4)
    expect(getDiatonicIndex('B', 4, 'treble')).toBe(4)
    // F5 is top line (index 8)
    expect(getDiatonicIndex('F', 5, 'treble')).toBe(8)
    // Middle C (C4) is 1 ledger line below (index -2)
    expect(getDiatonicIndex('C', 4, 'treble')).toBe(-2)
  })

  it('calculates correct diatonic positions for bass clef', () => {
    // G2 is bottom line (index 0)
    expect(getDiatonicIndex('G', 2, 'bass')).toBe(0)
    // C3 is 2nd space (index 3)
    expect(getDiatonicIndex('C', 3, 'bass')).toBe(3)
    // A3 is top line (index 8)
    expect(getDiatonicIndex('A', 3, 'bass')).toBe(8)
    // Middle C (C4) is 1 ledger line above (index 10)
    expect(getDiatonicIndex('C', 4, 'bass')).toBe(10)
  })

  it('computes note Y coordinates accurately based on staff lines', () => {
    const pitchE4: Pitch = { step: 'E', octave: 4, accidental: 'natural', solfege: 'mi', displayBadgeText: 'mi' }
    const pitchF5: Pitch = { step: 'F', octave: 5, accidental: 'natural', solfege: 'fa', displayBadgeText: 'fa' }

    const baseY = 50
    const lineSpacing = 10
    // bottom line is baseY + 4 * 10 = 90
    expect(getNoteY(pitchE4, 'treble', baseY, lineSpacing)).toBe(90) // E4 on bottom line
    // top line is baseY = 50
    expect(getNoteY(pitchF5, 'treble', baseY, lineSpacing)).toBe(50) // F5 on top line
  })

  it('computes and renders ledger lines for Middle C (C4) in treble clef', () => {
    const pitchC4: Pitch = { step: 'C', octave: 4, accidental: 'natural', solfege: 'do', displayBadgeText: 'do' }
    const baseY = 50
    const lineSpacing = 10

    const ledgerYs = getLedgerLineYCoordinates(pitchC4, 'treble', baseY, lineSpacing)
    expect(ledgerYs.length).toBe(1)
    expect(ledgerYs[0]).toBe(100) // 1 line below bottom line (90 + 10 = 100)

    render(
      <svg>
        <LedgerLines x={120} yCoordinates={ledgerYs} />
      </svg>,
    )

    expect(screen.getByTestId('ledger-lines-group')).toBeInTheDocument()
    expect(screen.getByTestId('ledger-line')).toBeInTheDocument()
  })
})
