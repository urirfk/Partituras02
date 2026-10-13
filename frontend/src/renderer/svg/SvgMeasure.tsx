import React from 'react'
import type { LayoutedMeasure } from '../layout/systemPartitioning'
import type { Clef } from './pitchCoordinates'
import type { Note } from '../../types/music'
import { SvgNote } from './SvgNote'

export interface SvgMeasureProps {
  layoutedMeasure: LayoutedMeasure
  baseY: number
  lineSpacing?: number
  clef?: Clef
  showNoteNames?: boolean
  showAccidentals?: boolean
  showFingerings?: boolean
  showLyrics?: boolean
  isLastInSystem?: boolean
  selectedNoteId?: string
  onNoteClick?: (note: Note) => void
  className?: string
}

export const SvgMeasure: React.FC<SvgMeasureProps> = ({
  layoutedMeasure,
  baseY,
  lineSpacing = 10,
  clef = 'treble',
  showNoteNames = true,
  showAccidentals = true,
  showFingerings = true,
  showLyrics = true,
  isLastInSystem = false,
  selectedNoteId,
  onNoteClick,
  className = '',
}) => {
  const bottomLineY = baseY + 4 * lineSpacing
  const rightBarlineX = layoutedMeasure.startX + layoutedMeasure.width

  return (
    <g
      className={`svg-measure ${className}`}
      data-testid={`svg-measure-${layoutedMeasure.measure.number}`}
    >
      {/* Intermediate or Closing Barline */}
      <line
        x1={rightBarlineX}
        y1={baseY}
        x2={rightBarlineX}
        y2={bottomLineY}
        stroke="#27272a"
        strokeWidth={isLastInSystem ? 1.5 : 1}
        data-testid={`barline-${layoutedMeasure.measure.number}`}
      />

      {/* Render Positioned Upper/Treble Notes */}
      {layoutedMeasure.positionedNotes.map((pn) => (
        <SvgNote
          key={pn.note.id}
          note={pn.note}
          x={pn.x}
          clef={clef}
          baseY={baseY}
          lineSpacing={lineSpacing}
          showNoteNames={showNoteNames}
          showAccidentals={showAccidentals}
          showFingerings={showFingerings}
          showLyrics={showLyrics}
          selected={selectedNoteId === pn.note.id}
          onClick={() => onNoteClick?.(pn.note)}
        />
      ))}

      {/* Render Lower Notes if Grand Staff */}
      {layoutedMeasure.positionedLowerNotes?.map((pn) => (
        <SvgNote
          key={`lower-${pn.note.id}`}
          note={pn.note}
          x={pn.x}
          clef="bass"
          baseY={baseY + 70} // Bass staff offset
          lineSpacing={lineSpacing}
          showNoteNames={showNoteNames}
          showAccidentals={showAccidentals}
          showFingerings={showFingerings}
          showLyrics={false} // Lyrics typically under upper staff
          selected={selectedNoteId === pn.note.id}
          onClick={() => onNoteClick?.(pn.note)}
        />
      ))}
    </g>
  )
}

export default SvgMeasure
