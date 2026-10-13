import React from 'react'
import type { ChordSymbol } from '../../types/music'
import type { ChordNotation } from '../../types/scoreConfig'
import { formatChordText } from './chordFormatting'

export interface SvgChordProps {
  chord: ChordSymbol
  x: number
  y: number // Upper baseline above staff (typically baseY - 26)
  notation?: ChordNotation
  showChords?: boolean
  onClick?: () => void
  className?: string
}

export const SvgChord: React.FC<SvgChordProps> = ({
  chord,
  x,
  y,
  notation = 'latin',
  showChords = true,
  onClick,
  className = '',
}) => {
  if (!showChords) {
    return null
  }

  const displayText = formatChordText(chord.fullText, chord.root, notation)

  return (
    <g
      className={`svg-chord cursor-pointer select-none group ${className}`}
      onClick={onClick}
      data-testid="svg-chord"
    >
      <text
        x={x}
        y={y}
        fill="#18181b"
        fontSize="16px"
        fontWeight="800"
        fontFamily="ui-sans-serif, system-ui, -apple-system, sans-serif"
        textAnchor="start"
        dominantBaseline="auto"
        className="transition-colors group-hover:fill-blue-600"
        data-testid={`chord-text-${chord.id}`}
      >
        {displayText}
      </text>
    </g>
  )
}

export default SvgChord
