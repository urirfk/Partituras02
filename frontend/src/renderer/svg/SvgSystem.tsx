import React from 'react'
import type { SystemLayout } from '../layout/systemPartitioning'
import type { Clef } from './pitchCoordinates'
import type { KeySignature, Note, ChordSymbol, StaffType } from '../../types/music'
import type { ChordNotation } from '../../types/scoreConfig'
import { StaffLines } from './StaffLines'
import { SvgMeasure } from './SvgMeasure'
import { GrandStaffBrace } from './GrandStaffBrace'

export interface SvgSystemProps {
  system: SystemLayout
  baseY?: number
  lineSpacing?: number
  clef?: Clef
  staffType?: StaffType
  staffGap?: number
  keySignature?: KeySignature
  showNoteNames?: boolean
  showAccidentals?: boolean
  showFingerings?: boolean
  showChords?: boolean
  chordNotation?: ChordNotation
  showTuplets?: boolean
  showLyrics?: boolean
  showMeasureNumbers?: boolean
  selectedNoteId?: string
  onNoteClick?: (note: Note) => void
  onChordClick?: (chord: ChordSymbol) => void
  className?: string
}

export const SvgSystem: React.FC<SvgSystemProps> = ({
  system,
  baseY = 60,
  lineSpacing = 10,
  clef = 'treble',
  staffType = 'single',
  staffGap = 50,
  keySignature,
  showNoteNames = true,
  showAccidentals = true,
  showFingerings = true,
  showChords = true,
  chordNotation = 'latin',
  showTuplets = true,
  showLyrics = true,
  showMeasureNumbers = true,
  selectedNoteId,
  onNoteClick,
  onChordClick,
  className = '',
}) => {
  const isGrandStaff =
    staffType === 'grand' ||
    system.measures.some(
      (m) =>
        m.positionedLowerNotes && m.positionedLowerNotes.length > 0,
    )
  const bassBaseY = baseY + 4 * lineSpacing + staffGap
  const bassBottomLineY = bassBaseY + 4 * lineSpacing

  return (
    <g
      className={`svg-system ${className}`}
      data-testid={`svg-system-${system.systemIndex}`}
    >
      {/* Measure Number at Start of System (e.g. 34, 36, 38 in ejemplo01.png) */}
      {showMeasureNumbers && (
        <text
          x={4}
          y={baseY - 8}
          fontSize="15px"
          fontFamily="serif"
          fontWeight="normal"
          fill="#71717a"
          className="select-none"
          data-testid="system-measure-number"
        >
          {system.startMeasureNumber}
        </text>
      )}

      {/* Piano Accolade (Grand Staff Curly Brace & Vertical Line) */}
      {isGrandStaff && (
        <GrandStaffBrace
          x={10}
          topY={baseY}
          bottomY={bassBottomLineY}
          braceWidth={11}
        />
      )}

      {/* Upper (Treble) 5 Continuous Staff Lines */}
      <StaffLines
        startX={0}
        endX={system.width}
        baseY={baseY}
        lineSpacing={lineSpacing}
        clef={clef}
        data-testid="upper-staff-lines"
      />

      {/* Lower (Bass) 5 Continuous Staff Lines if Grand Staff */}
      {isGrandStaff && (
        <StaffLines
          startX={0}
          endX={system.width}
          baseY={bassBaseY}
          lineSpacing={lineSpacing}
          clef="bass"
          data-testid="lower-staff-lines"
        />
      )}

      {/* Key Signature representation if present (e.g. 3 flats as in ejemplo01.png) */}
      {keySignature && keySignature.fifths === -3 && (
        <g data-testid="key-signature-group">
          {/* Upper Staff Flats */}
          <text
            x={38}
            y={baseY + 2 * lineSpacing - 1}
            fontSize="18px"
            fontFamily="serif"
            fill="#27272a"
          >
            ♭
          </text>
          <text
            x={45}
            y={baseY + 0.5 * lineSpacing - 1}
            fontSize="18px"
            fontFamily="serif"
            fill="#27272a"
          >
            ♭
          </text>
          <text
            x={52}
            y={baseY + 2.5 * lineSpacing - 1}
            fontSize="18px"
            fontFamily="serif"
            fill="#27272a"
          >
            ♭
          </text>

          {/* Lower Staff Flats if Grand Staff */}
          {isGrandStaff && (
            <g data-testid="lower-key-signature-group">
              <text
                x={38}
                y={bassBaseY + 3 * lineSpacing - 1}
                fontSize="18px"
                fontFamily="serif"
                fill="#27272a"
              >
                ♭
              </text>
              <text
                x={45}
                y={bassBaseY + 1.5 * lineSpacing - 1}
                fontSize="18px"
                fontFamily="serif"
                fill="#27272a"
              >
                ♭
              </text>
              <text
                x={52}
                y={bassBaseY + 3.5 * lineSpacing - 1}
                fontSize="18px"
                fontFamily="serif"
                fill="#27272a"
              >
                ♭
              </text>
            </g>
          )}
        </g>
      )}

      {/* Render All Measures of this System */}
      {system.measures.map((layoutedMeasure, idx) => (
        <SvgMeasure
          key={`system-${system.systemIndex}-m-${layoutedMeasure.measure.number}`}
          layoutedMeasure={layoutedMeasure}
          baseY={baseY}
          lineSpacing={lineSpacing}
          clef={clef}
          staffType={isGrandStaff ? 'grand' : 'single'}
          staffGap={staffGap}
          showNoteNames={showNoteNames}
          showAccidentals={showAccidentals}
          showFingerings={showFingerings}
          showChords={showChords}
          chordNotation={chordNotation}
          showTuplets={showTuplets}
          showLyrics={showLyrics}
          isLastInSystem={idx === system.measures.length - 1}
          selectedNoteId={selectedNoteId}
          onNoteClick={onNoteClick}
          onChordClick={onChordClick}
        />
      ))}
    </g>
  )
}

export default SvgSystem
