import React from 'react'
import type { LayoutedMeasure } from '../layout/systemPartitioning'
import type { Clef } from './pitchCoordinates'
import type { Note, ChordSymbol, StaffType, Pitch } from '../../types/music'
import type { ChordNotation } from '../../types/scoreConfig'
import { SvgNote } from './SvgNote'
import { SvgChord } from './SvgChord'
import { TupletBracket } from './TupletBracket'
import {
  findTupletGroups,
  calculateChordPositions,
} from '../layout/measureAnnotations'
import { findBeamGroups } from '../layout/measureBeaming'
import { getDiatonicIndex, getNoteY } from './pitchCoordinates'

export interface SvgMeasureProps {
  layoutedMeasure: LayoutedMeasure
  baseY: number
  lineSpacing?: number
  clef?: Clef
  staffType?: StaffType
  staffGap?: number
  showNoteNames?: boolean
  showAccidentals?: boolean
  showFingerings?: boolean
  showChords?: boolean
  chordNotation?: ChordNotation
  showTuplets?: boolean
  showLyrics?: boolean
  isLastInSystem?: boolean
  selectedNoteId?: string
  onNoteClick?: (note: Note) => void
  onChordClick?: (chord: ChordSymbol) => void
  className?: string
}

interface TieArc {
  id: string
  d: string
}

function computeTieArcs(
  positionedNotes: { note: Note; x: number }[],
  staffClef: Clef,
  staffBaseY: number,
  lineSpacing: number,
  measureStartX: number,
  measureEndX: number,
): TieArc[] {
  const arcs: TieArc[] = []

  for (let i = 0; i < positionedNotes.length; i++) {
    const pn = positionedNotes[i]
    if (pn.note.isRest || !pn.note.pitch) continue

    const tie = pn.note.tie
    if (!tie) continue

    const pitch = pn.note.pitch as Pitch
    const y1 = getNoteY(pitch, staffClef, staffBaseY, lineSpacing)
    const diatonic = getDiatonicIndex(pitch.step, pitch.octave, staffClef)
    const stemsUp = diatonic < 4

    // Outgoing tie (start or continue)
    if (tie === 'start' || tie === 'continue') {
      // Look for next non-rest note in this measure
      let nextPn: { note: Note; x: number } | null = null
      for (let j = i + 1; j < positionedNotes.length; j++) {
        if (!positionedNotes[j].note.isRest && positionedNotes[j].note.pitch) {
          nextPn = positionedNotes[j]
          break
        }
      }

      if (nextPn && nextPn.note.pitch) {
        const y2 = getNoteY(nextPn.note.pitch, staffClef, staffBaseY, lineSpacing)
        const x1 = pn.x + 8
        const x2 = nextPn.x - 8
        const midX = (x1 + x2) / 2

        if (stemsUp) {
          const bowY = Math.max(y1, y2) + 14
          arcs.push({
            id: `tie-${pn.note.id}-${nextPn.note.id}`,
            d: `M ${x1} ${y1 + 7} Q ${midX} ${bowY} ${x2} ${y2 + 7}`,
          })
        } else {
          const bowY = Math.min(y1, y2) - 14
          arcs.push({
            id: `tie-${pn.note.id}-${nextPn.note.id}`,
            d: `M ${x1} ${y1 - 7} Q ${midX} ${bowY} ${x2} ${y2 - 7}`,
          })
        }
      } else {
        // Tie to next measure across right barline
        const x1 = pn.x + 8
        const x2 = measureEndX - 2
        const midX = (x1 + x2) / 2

        if (stemsUp) {
          arcs.push({
            id: `tie-out-${pn.note.id}`,
            d: `M ${x1} ${y1 + 7} Q ${midX} ${y1 + 13} ${x2} ${y1 + 9}`,
          })
        } else {
          arcs.push({
            id: `tie-out-${pn.note.id}`,
            d: `M ${x1} ${y1 - 7} Q ${midX} ${y1 - 13} ${x2} ${y1 - 9}`,
          })
        }
      }
    }

    // Incoming tie from previous measure on the first note
    if (i === 0 && (tie === 'stop' || tie === 'continue')) {
      const x1 = measureStartX + 2
      const x2 = pn.x - 8
      const midX = (x1 + x2) / 2

      if (stemsUp) {
        arcs.push({
          id: `tie-in-${pn.note.id}`,
          d: `M ${x1} ${y1 + 9} Q ${midX} ${y1 + 13} ${x2} ${y1 + 7}`,
        })
      } else {
        arcs.push({
          id: `tie-in-${pn.note.id}`,
          d: `M ${x1} ${y1 - 9} Q ${midX} ${y1 - 13} ${x2} ${y1 - 7}`,
        })
      }
    }
  }

  return arcs
}

export const SvgMeasure: React.FC<SvgMeasureProps> = ({
  layoutedMeasure,
  baseY,
  lineSpacing = 10,
  clef = 'treble',
  staffType,
  staffGap = 50,
  showNoteNames = true,
  showAccidentals = true,
  showFingerings = true,
  showChords = true,
  chordNotation = 'latin',
  showTuplets = true,
  showLyrics = true,
  isLastInSystem = false,
  selectedNoteId,
  onNoteClick,
  onChordClick,
  className = '',
}) => {
  const isGrandStaff =
    staffType === 'grand' ||
    Boolean(
      layoutedMeasure.positionedLowerNotes &&
        layoutedMeasure.positionedLowerNotes.length > 0,
    )
  const trebleBottomLineY = baseY + 4 * lineSpacing
  const bassBaseY = baseY + 4 * lineSpacing + staffGap
  const bassBottomLineY = bassBaseY + 4 * lineSpacing
  const barlineEndY = isGrandStaff ? bassBottomLineY : trebleBottomLineY
  const rightBarlineX = layoutedMeasure.startX + layoutedMeasure.width

  // Compact detection: if notes are tightly spaced (< 32px), enable compact pill styling
  const upperNotes = layoutedMeasure.positionedNotes
  const minUpperDistance = upperNotes.reduce((min, pn, idx, arr) => {
    if (idx === 0) return min
    const dist = pn.x - arr[idx - 1].x
    return dist < min ? dist : min
  }, 999)
  const isUpperCompact = minUpperDistance < 32

  const lowerNotes = layoutedMeasure.positionedLowerNotes || []
  const minLowerDistance = lowerNotes.reduce((min, pn, idx, arr) => {
    if (idx === 0) return min
    const dist = pn.x - arr[idx - 1].x
    return dist < min ? dist : min
  }, 999)
  const isLowerCompact = minLowerDistance < 32

  // Find tuplet brackets
  const tupletGroups = showTuplets
    ? findTupletGroups(upperNotes, {
        clef,
        baseY,
        lineSpacing,
        showFingerings,
      })
    : []

  // Find beam groups for upper and lower staves
  const upperBeamGroups = findBeamGroups(upperNotes, {
    clef,
    baseY,
    lineSpacing,
    showNoteNames,
    showAccidentals,
    isCompact: isUpperCompact,
    timeSignature: layoutedMeasure.measure.timeSignature,
  })

  const lowerBeamGroups = findBeamGroups(lowerNotes, {
    clef: 'bass',
    baseY: bassBaseY,
    lineSpacing,
    showNoteNames,
    showAccidentals,
    isCompact: isLowerCompact,
    timeSignature: layoutedMeasure.measure.timeSignature,
  })

  // Lookups for beamed note properties
  interface BeamedLookup {
    isBeamed: boolean
    stemDirection: 'up' | 'down'
    stemEndY: number
  }

  const upperBeamedMap = new Map<string, BeamedLookup>()
  for (const bg of upperBeamGroups) {
    for (const bn of bg.notes) {
      upperBeamedMap.set(bn.note.id, {
        isBeamed: true,
        stemDirection: bg.stemDirection,
        stemEndY: bn.stemEndY,
      })
    }
  }

  const lowerBeamedMap = new Map<string, BeamedLookup>()
  for (const bg of lowerBeamGroups) {
    for (const bn of bg.notes) {
      lowerBeamedMap.set(bn.note.id, {
        isBeamed: true,
        stemDirection: bg.stemDirection,
        stemEndY: bn.stemEndY,
      })
    }
  }

  // Find tie arcs
  const upperTieArcs = computeTieArcs(
    upperNotes,
    clef,
    baseY,
    lineSpacing,
    layoutedMeasure.startX,
    rightBarlineX,
  )

  const lowerTieArcs = computeTieArcs(
    lowerNotes,
    'bass',
    bassBaseY,
    lineSpacing,
    layoutedMeasure.startX,
    rightBarlineX,
  )

  // Position chords above the measure
  const positionedChords =
    showChords && layoutedMeasure.measure.chords
      ? calculateChordPositions(
          layoutedMeasure.measure.chords,
          layoutedMeasure,
          { baseY },
          tupletGroups,
        )
      : []

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
        y2={barlineEndY}
        stroke="#27272a"
        strokeWidth={isLastInSystem ? 1.5 : 1}
        data-testid={`barline-${layoutedMeasure.measure.number}`}
      />

      {/* Render Tuplet Brackets */}
      {tupletGroups.map((tg) => (
        <TupletBracket
          key={tg.id}
          startX={tg.startX}
          endX={tg.endX}
          y={tg.y}
          number={tg.number}
        />
      ))}

      {/* Render Chords */}
      {positionedChords.map((pc) => (
        <SvgChord
          key={pc.chord.id}
          chord={pc.chord}
          x={pc.x}
          y={pc.y}
          notation={chordNotation}
          showChords={showChords}
          onClick={() => onChordClick?.(pc.chord)}
        />
      ))}

      {/* Render Upper Beam Bars */}
      {upperBeamGroups.map((bg) => (
        <g key={bg.id} data-testid="beam-group">
          {/* Primary Beam Bar */}
          <line
            x1={bg.startX}
            y1={bg.startY}
            x2={bg.endX}
            y2={bg.endY}
            stroke="#18181b"
            strokeWidth={3.8}
            strokeLinecap="butt"
            data-testid="beam-bar"
          />
          {/* Secondary Beam Segments for 16th / 32nd notes */}
          {bg.secondarySegments.map((seg, sIdx) => (
            <line
              key={`sec-${sIdx}`}
              x1={seg.startX}
              y1={seg.startY}
              x2={seg.endX}
              y2={seg.endY}
              stroke="#18181b"
              strokeWidth={3.2}
              strokeLinecap="butt"
              data-testid="secondary-beam-bar"
            />
          ))}
        </g>
      ))}

      {/* Render Lower Beam Bars if Grand Staff */}
      {lowerBeamGroups.map((bg) => (
        <g key={bg.id} data-testid="lower-beam-group">
          <line
            x1={bg.startX}
            y1={bg.startY}
            x2={bg.endX}
            y2={bg.endY}
            stroke="#18181b"
            strokeWidth={3.8}
            strokeLinecap="butt"
            data-testid="beam-bar"
          />
          {bg.secondarySegments.map((seg, sIdx) => (
            <line
              key={`lower-sec-${sIdx}`}
              x1={seg.startX}
              y1={seg.startY}
              x2={seg.endX}
              y2={seg.endY}
              stroke="#18181b"
              strokeWidth={3.2}
              strokeLinecap="butt"
              data-testid="secondary-beam-bar"
            />
          ))}
        </g>
      ))}

      {/* Render Tie / Slur Arcs */}
      {[...upperTieArcs, ...lowerTieArcs].map((arc) => (
        <path
          key={arc.id}
          d={arc.d}
          fill="none"
          stroke="#18181b"
          strokeWidth={1.8}
          strokeLinecap="round"
          data-testid="note-tie"
        />
      ))}

      {/* Render Positioned Upper/Treble Notes */}
      {upperNotes.map((pn) => {
        const beamed = upperBeamedMap.get(pn.note.id)
        return (
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
            isCompact={isUpperCompact}
            isBeamed={beamed?.isBeamed ?? false}
            stemDirection={beamed?.stemDirection ?? 'auto'}
            stemEndYOverride={beamed?.stemEndY}
            selected={selectedNoteId === pn.note.id}
            onClick={() => onNoteClick?.(pn.note)}
          />
        )
      })}

      {/* Render Lower Notes if Grand Staff */}
      {lowerNotes.map((pn) => {
        const beamed = lowerBeamedMap.get(pn.note.id)
        return (
          <SvgNote
            key={`lower-${pn.note.id}`}
            note={pn.note}
            x={pn.x}
            clef="bass"
            baseY={bassBaseY}
            lineSpacing={lineSpacing}
            showNoteNames={showNoteNames}
            showAccidentals={showAccidentals}
            showFingerings={showFingerings}
            showLyrics={false} // Lyrics typically under upper staff
            isCompact={isLowerCompact}
            isBeamed={beamed?.isBeamed ?? false}
            stemDirection={beamed?.stemDirection ?? 'auto'}
            stemEndYOverride={beamed?.stemEndY}
            selected={selectedNoteId === pn.note.id}
            onClick={() => onNoteClick?.(pn.note)}
          />
        )
      })}
    </g>
  )
}

export default SvgMeasure
