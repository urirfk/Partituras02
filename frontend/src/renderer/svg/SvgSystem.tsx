import React from 'react'
import type { SystemLayout } from '../layout/systemPartitioning'
import type { Clef } from './pitchCoordinates'
import type { KeySignature, Note, ChordSymbol } from '../../types/music'
import type { ChordNotation } from '../../types/scoreConfig'
import { StaffLines } from './StaffLines'
import { SvgMeasure } from './SvgMeasure'

export interface SvgSystemProps {
  system: SystemLayout
  baseY?: number
  lineSpacing?: number
  clef?: Clef
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

      {/* 5 Continuous Staff Lines across the whole System */}
      <StaffLines
        startX={0}
        endX={system.width}
        baseY={baseY}
        lineSpacing={lineSpacing}
        clef={clef}
      />

      {/* Key Signature representation if present (e.g. 3 flats as in ejemplo01.png) */}
      {keySignature && keySignature.fifths === -3 && (
        <g data-testid="key-signature-group">
          {/* Flat 1: B♭ on 3rd line */}
          <text
            x={38}
            y={baseY + 2 * lineSpacing - 1}
            fontSize="18px"
            fontFamily="serif"
            fill="#27272a"
          >
            ♭
          </text>
          {/* Flat 2: E♭ on 4th space */}
          <text
            x={45}
            y={baseY + 0.5 * lineSpacing - 1}
            fontSize="18px"
            fontFamily="serif"
            fill="#27272a"
          >
            ♭
          </text>
          {/* Flat 3: A♭ on 2nd space */}
          <text
            x={52}
            y={baseY + 2.5 * lineSpacing - 1}
            fontSize="18px"
            fontFamily="serif"
            fill="#27272a"
          >
            ♭
          </text>
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
