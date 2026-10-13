import React from 'react'
import type { Pitch } from '../../types/music'

export interface NoteHeadCapsuleProps {
  x: number
  y: number
  pitch?: Pitch
  showNoteNames?: boolean
  showAccidentals?: boolean
  isRest?: boolean
  className?: string
  onClick?: () => void
}

/**
 * Renders an educational notehead adhering to the EZ-play specifications.
 * When showNoteNames is true, it renders a black pill/capsule with white text (e.g. "mi", "♭la").
 * When showNoteNames is false, it renders a standard classic solid musical notehead oval.
 */
export const NoteHeadCapsule: React.FC<NoteHeadCapsuleProps> = ({
  x,
  y,
  pitch,
  showNoteNames = true,
  showAccidentals = true,
  isRest = false,
  className = '',
  onClick,
}) => {
  if (isRest) {
    return null
  }

  // If note names are turned off, render a standard classic oval notehead
  if (!showNoteNames || !pitch) {
    return (
      <ellipse
        cx={x}
        cy={y}
        rx={7}
        ry={5}
        transform={`rotate(-20 ${x} ${y})`}
        fill="#18181b"
        className={`cursor-pointer transition-opacity hover:opacity-80 ${className}`}
        onClick={onClick}
        data-testid="classic-notehead"
      />
    )
  }

  const { solfege, accidental } = pitch

  // Format label text according to orthogonal accidental switch
  let prefix = ''
  if (showAccidentals) {
    if (accidental === 'flat') prefix = '♭'
    else if (accidental === 'sharp') prefix = '♯'
  }

  const displayText = `${prefix}${solfege}`

  // Calculate pill width dynamically based on text length
  // e.g. "mi" (2 chars) -> 26px, "♭la" (3 chars) -> 32px
  const width = displayText.length >= 3 ? 32 : 26
  const height = 15
  const rx = 4 // rounded corners creating a smooth stadium pill
  const ry = 4

  const rectX = x - width / 2
  const rectY = y - height / 2

  return (
    <g
      className={`select-none cursor-pointer group ${className}`}
      onClick={onClick}
      data-testid="notehead-capsule"
    >
      {/* Pill Capsule Background */}
      <rect
        x={rectX}
        y={rectY}
        width={width}
        height={height}
        rx={rx}
        ry={ry}
        fill="#18181b"
        className="transition-colors group-hover:fill-zinc-700"
      />

      {/* Embedded White Solfege Text */}
      <text
        x={x}
        y={y + 0.5}
        fill="#ffffff"
        fontSize="10.5px"
        fontWeight="bold"
        fontFamily="ui-sans-serif, system-ui, sans-serif"
        textAnchor="middle"
        dominantBaseline="central"
        letterSpacing="-0.3px"
      >
        {displayText}
      </text>
    </g>
  )
}

export default NoteHeadCapsule
