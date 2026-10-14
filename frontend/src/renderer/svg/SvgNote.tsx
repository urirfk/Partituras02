import React from 'react'
import type { Note, Pitch } from '../../types/music'
import { NoteHeadCapsule } from './NoteHeadCapsule'
import { LedgerLines } from './StaffLines'
import {
  Clef,
  getDiatonicIndex,
  getNoteY,
  getLedgerLineYCoordinates,
} from './pitchCoordinates'

export interface SvgNoteProps {
  note: Note
  x: number
  clef?: Clef
  baseY: number // Top staff line Y
  lineSpacing?: number
  showNoteNames?: boolean
  showAccidentals?: boolean
  showFingerings?: boolean
  showLyrics?: boolean
  stemDirection?: 'up' | 'down' | 'auto'
  isBeamed?: boolean
  stemEndYOverride?: number
  isCompact?: boolean
  selected?: boolean
  onClick?: () => void
  className?: string
}

export const SvgNote: React.FC<SvgNoteProps> = ({
  note,
  x,
  clef = 'treble',
  baseY,
  lineSpacing = 10,
  showNoteNames = true,
  showAccidentals = true,
  showFingerings = true,
  showLyrics = true,
  stemDirection = 'auto',
  isBeamed = false,
  stemEndYOverride,
  isCompact = false,
  selected = false,
  onClick,
  className = '',
}) => {
  const bottomLineY = baseY + 4 * lineSpacing

  // REST RENDERING
  if (note.isRest) {
    const restCenterY = baseY + 2 * lineSpacing
    return (
      <g
        className={`svg-rest cursor-pointer select-none ${className}`}
        onClick={onClick}
        data-testid="svg-rest"
      >
        {selected && (
          <circle cx={x} cy={restCenterY} r={16} fill="none" stroke="#3b82f6" strokeWidth={2} />
        )}
        {/* Simplified clean musical rest representation */}
        <text
          x={x}
          y={restCenterY}
          fontSize="22px"
          fontFamily="serif"
          fill="#27272a"
          dominantBaseline="central"
          textAnchor="middle"
        >
          {note.duration === 'whole'
            ? '𝄻'
            : note.duration === 'half'
            ? '𝄼'
            : note.duration === 'quarter'
            ? '𝄽'
            : '𝄾'}
        </text>
      </g>
    )
  }

  const pitch = note.pitch as Pitch
  const noteY = getNoteY(pitch, clef, baseY, lineSpacing)
  const ledgerYs = getLedgerLineYCoordinates(pitch, clef, baseY, lineSpacing)

  // Calculate notehead width for stem alignment
  const hasLongName = showNoteNames && pitch.solfege && (showAccidentals && pitch.accidental !== 'natural' ? 3 : 2) >= 3
  const halfCapsuleWidth = showNoteNames
    ? isCompact
      ? hasLongName
        ? 11.5
        : 9.5
      : hasLongName
      ? 16
      : 13
    : 6.5

  // Stem Direction Determination
  const diatonicIndex = getDiatonicIndex(pitch.step, pitch.octave, clef)
  const actualStemDir: 'up' | 'down' =
    stemDirection === 'auto' ? (diatonicIndex < 4 ? 'up' : 'down') : stemDirection

  const hasStem = note.duration !== 'whole'
  const stemHeight = 35
  const stemX = actualStemDir === 'up' ? x + halfCapsuleWidth : x - halfCapsuleWidth
  const stemStartY = noteY
  const stemEndY =
    stemEndYOverride !== undefined
      ? stemEndYOverride
      : actualStemDir === 'up'
      ? noteY - stemHeight
      : noteY + stemHeight

  // Dot coordinates
  const hasDots = note.dots > 0
  const dotX = x + halfCapsuleWidth + 6
  // Shift dot slightly into space if note is exactly on a staff line
  const isLineNote = diatonicIndex % 2 === 0
  const dotY = isLineNote ? noteY - lineSpacing / 4 : noteY

  // Fingering (e.g. 1, 2, 3, 4, 5) positioned above the note
  const fingeringY = actualStemDir === 'up' ? stemEndY - 8 : noteY - halfCapsuleWidth - 10

  // Lyrics positioned below the staff
  const lyricsY = bottomLineY + 28

  return (
    <g
      role="button"
      tabIndex={0}
      className={`svg-note group cursor-pointer focus:outline-none ${selected ? 'is-selected' : ''} ${className}`}
      onClick={onClick}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onClick?.();
        }
      }}
      data-testid="svg-note"
    >
      {/* Selection Glow / Ring */}
      {selected && (
        <rect
          x={x - halfCapsuleWidth - 4}
          y={noteY - 10}
          width={halfCapsuleWidth * 2 + 8}
          height={20}
          rx={6}
          fill="none"
          stroke="#3b82f6"
          strokeWidth={2}
          strokeDasharray="3 3"
        />
      )}

      {/* Ledger Lines if note is outside the 5 staff lines */}
      <LedgerLines x={x} yCoordinates={ledgerYs} width={halfCapsuleWidth * 2 + 8} />

      {/* Stem (Plica) */}
      {hasStem && (
        <line
          x1={stemX}
          y1={stemStartY}
          x2={stemX}
          y2={stemEndY}
          stroke="#18181b"
          strokeWidth={1.8}
          strokeLinecap="round"
          data-testid="note-stem"
        />
      )}

      {/* Flags for Eighth / 16th isolated notes (suppressed when beamed) */}
      {hasStem && !isBeamed && (note.duration === 'eighth' || note.duration === '16th') && (
        <path
          d={
            actualStemDir === 'up'
              ? `M ${stemX} ${stemEndY} C ${stemX + 8} ${stemEndY + 8}, ${stemX + 8} ${stemEndY + 16}, ${stemX} ${stemEndY + 20}`
              : `M ${stemX} ${stemEndY} C ${stemX + 8} ${stemEndY - 8}, ${stemX + 8} ${stemEndY - 16}, ${stemX} ${stemEndY - 20}`
          }
          fill="none"
          stroke="#18181b"
          strokeWidth={2}
          strokeLinecap="round"
          data-testid="note-flag"
        />
      )}

      {/* Augmentation Dot (Puntillo) */}
      {hasDots && (
        <circle
          cx={dotX}
          cy={dotY}
          r={2.2}
          fill="#18181b"
          data-testid="note-dot"
        />
      )}

      {/* Didactic Capsule Notehead */}
      <NoteHeadCapsule
        x={x}
        y={noteY}
        pitch={pitch}
        showNoteNames={showNoteNames}
        showAccidentals={showAccidentals}
        isCompact={isCompact}
      />

      {/* Fingering Number (1 to 5) above note */}
      {showFingerings && note.fingering && (
        <text
          x={x}
          y={fingeringY}
          fill="#18181b"
          fontSize="12px"
          fontWeight="bold"
          fontFamily="ui-sans-serif, system-ui, sans-serif"
          textAnchor="middle"
          dominantBaseline="auto"
          className="select-none font-mono"
          data-testid="note-fingering"
        >
          {note.fingering}
        </text>
      )}

      {/* Lyrics (Letra) below the staff */}
      {showLyrics && note.lyrics && (
        <text
          x={x}
          y={lyricsY}
          fill="#3f3f46"
          fontSize="11.5px"
          fontFamily="ui-sans-serif, system-ui, sans-serif"
          textAnchor="middle"
          dominantBaseline="central"
          className="select-none"
          data-testid="note-lyrics"
        >
          {note.lyrics}
        </text>
      )}
    </g>
  )
}

export default SvgNote
