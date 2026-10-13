import React from 'react'
import type { Clef } from './pitchCoordinates'

export interface StaffLinesProps {
  startX: number
  endX: number
  baseY: number // Top staff line Y
  lineSpacing?: number // Distance between adjacent staff lines (default: 10px)
  strokeColor?: string
  strokeWidth?: number
  clef?: Clef
  showBarLines?: boolean
  className?: string
}

export const StaffLines: React.FC<StaffLinesProps> = ({
  startX,
  endX,
  baseY,
  lineSpacing = 10,
  strokeColor = '#27272a',
  strokeWidth = 1,
  clef,
  showBarLines = true,
  className = '',
}) => {
  const lines = [0, 1, 2, 3, 4].map((i) => baseY + i * lineSpacing)
  const bottomLineY = lines[4]

  return (
    <g className={`staff-lines ${className}`} data-testid="staff-lines-group">
      {/* 5 Parallel Horizontal Staff Lines */}
      {lines.map((y, index) => (
        <line
          key={`staff-line-${index}`}
          x1={startX}
          y1={y}
          x2={endX}
          y2={y}
          stroke={strokeColor}
          strokeWidth={strokeWidth}
          data-testid={`staff-line-${index + 1}`}
        />
      ))}

      {/* Start System Barline */}
      {showBarLines && (
        <line
          x1={startX}
          y1={baseY}
          x2={startX}
          y2={bottomLineY}
          stroke={strokeColor}
          strokeWidth={strokeWidth * 1.5}
          data-testid="start-barline"
        />
      )}

      {/* End System Barline */}
      {showBarLines && (
        <line
          x1={endX}
          y1={baseY}
          x2={endX}
          y2={bottomLineY}
          stroke={strokeColor}
          strokeWidth={strokeWidth * 1.5}
          data-testid="end-barline"
        />
      )}

      {/* Standard Musical Clef Glyph representation */}
      {clef && (
        <text
          x={startX + 10}
          y={clef === 'treble' ? baseY + 3 * lineSpacing : baseY + 1.5 * lineSpacing}
          fontSize={clef === 'treble' ? '36px' : '30px'}
          fontFamily="serif"
          fill={strokeColor}
          dominantBaseline="central"
          className="select-none"
          data-testid={`clef-${clef}`}
        >
          {clef === 'treble' ? '𝄞' : '𝄢'}
        </text>
      )}
    </g>
  )
}

export interface LedgerLinesProps {
  x: number
  yCoordinates: number[]
  width?: number
  strokeColor?: string
  strokeWidth?: number
}

export const LedgerLines: React.FC<LedgerLinesProps> = ({
  x,
  yCoordinates,
  width = 34,
  strokeColor = '#27272a',
  strokeWidth = 1,
}) => {
  if (!yCoordinates || yCoordinates.length === 0) {
    return null
  }

  const halfWidth = width / 2

  return (
    <g data-testid="ledger-lines-group">
      {yCoordinates.map((y, idx) => (
        <line
          key={`ledger-${idx}-${y}`}
          x1={x - halfWidth}
          y1={y}
          x2={x + halfWidth}
          y2={y}
          stroke={strokeColor}
          strokeWidth={strokeWidth}
          data-testid="ledger-line"
        />
      ))}
    </g>
  )
}

export default StaffLines
