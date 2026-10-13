import React from 'react'

export interface GrandStaffBraceProps {
  x?: number // X position where the brace touches the staves (default: 12)
  topY: number // Top line of upper staff (e.g. Treble line 1)
  bottomY: number // Bottom line of lower staff (e.g. Bass line 5)
  braceWidth?: number // Width of the ornate curve (default: 11)
  fillColor?: string
  className?: string
}

/**
 * GrandStaffBrace renders the classical piano bracket (accolade)
 * and vertical connector line grouping treble and bass staves.
 */
export const GrandStaffBrace: React.FC<GrandStaffBraceProps> = ({
  x = 12,
  topY,
  bottomY,
  braceWidth = 11,
  fillColor = '#18181b',
  className = '',
}) => {
  const height = bottomY - topY
  const midY = topY + height / 2
  const quarterH = height / 4

  // Outer curved contour (points outwards to the left)
  // Inner curved contour (returns along the inside with elegant thickness)
  const outerP1X = x - braceWidth * 0.35
  const outerP1Y = topY + quarterH * 0.4
  const outerP2X = x - braceWidth * 1.15
  const outerP2Y = midY - quarterH * 0.6
  const outerMidX = x - braceWidth
  const outerMidY = midY

  const outerP3X = x - braceWidth * 1.15
  const outerP3Y = midY + quarterH * 0.6
  const outerP4X = x - braceWidth * 0.35
  const outerP4Y = bottomY - quarterH * 0.4

  // Inner contour control points
  const innerMidX = x - braceWidth + 2.5
  const innerP4X = x - braceWidth * 0.65
  const innerP4Y = midY + quarterH * 0.5
  const innerP3X = x - braceWidth * 0.15
  const innerP3Y = bottomY - quarterH * 0.3

  const innerP2X = x - braceWidth * 0.65
  const innerP2Y = midY - quarterH * 0.5
  const innerP1X = x - braceWidth * 0.15
  const innerP1Y = topY + quarterH * 0.3

  const bracePath = [
    `M ${x} ${topY}`,
    `C ${outerP1X} ${outerP1Y}, ${outerP2X} ${outerP2Y}, ${outerMidX} ${outerMidY}`,
    `C ${outerP3X} ${outerP3Y}, ${outerP4X} ${outerP4Y}, ${x} ${bottomY}`,
    `C ${innerP3X} ${innerP3Y}, ${innerP4X} ${innerP4Y}, ${innerMidX} ${midY}`,
    `C ${innerP2X} ${innerP2Y}, ${innerP1X} ${innerP1Y}, ${x} ${topY}`,
    'Z',
  ].join(' ')

  return (
    <g
      className={`grand-staff-brace select-none ${className}`}
      data-testid="grand-staff-brace"
    >
      {/* Straight vertical connector bar connecting treble top line to bass bottom line */}
      <line
        x1={x}
        y1={topY}
        x2={x}
        y2={bottomY}
        stroke={fillColor}
        strokeWidth={1.6}
        strokeLinecap="square"
        data-testid="brace-vertical-line"
      />

      {/* Ornate curly bracket (accolade) */}
      <path
        d={bracePath}
        fill={fillColor}
        stroke={fillColor}
        strokeWidth={0.5}
        data-testid="brace-bracket-path"
      />
    </g>
  )
}

export default GrandStaffBrace
