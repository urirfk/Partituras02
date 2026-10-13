import React from 'react'

export interface TupletBracketProps {
  startX: number
  endX: number
  y: number // Y baseline of the bracket
  number?: number // Number of notes in the tuplet (default: 3)
  tickHeight?: number
  strokeColor?: string
  strokeWidth?: number
  className?: string
}

/**
 * Renders a clean musical tuplet bracket (e.g. [--- 3 ---])
 * adhering to the design seen in ejemplo01.png.
 */
export const TupletBracket: React.FC<TupletBracketProps> = ({
  startX,
  endX,
  y,
  number = 3,
  tickHeight = 5,
  strokeColor = '#18181b',
  strokeWidth = 1.2,
  className = '',
}) => {
  const midX = (startX + endX) / 2
  const textGap = 12 // Space reserved for the number in the center

  const leftSegmentEndX = midX - textGap
  const rightSegmentStartX = midX + textGap

  return (
    <g
      className={`tuplet-bracket select-none ${className}`}
      data-testid="tuplet-bracket"
    >
      {/* Left Vertical Tick and Horizontal Segment */}
      <path
        d={`M ${startX} ${y + tickHeight} L ${startX} ${y} L ${leftSegmentEndX} ${y}`}
        fill="none"
        stroke={strokeColor}
        strokeWidth={strokeWidth}
        strokeLinecap="square"
        data-testid="tuplet-left-arm"
      />

      {/* Centered Tuplet Number (typically 3) */}
      <text
        x={midX}
        y={y + 1}
        fill={strokeColor}
        fontSize="12px"
        fontWeight="bold"
        fontFamily="ui-sans-serif, system-ui, sans-serif"
        textAnchor="middle"
        dominantBaseline="central"
        data-testid="tuplet-number"
      >
        {number}
      </text>

      {/* Right Horizontal Segment and Vertical Tick */}
      <path
        d={`M ${rightSegmentStartX} ${y} L ${endX} ${y} L ${endX} ${y + tickHeight}`}
        fill="none"
        stroke={strokeColor}
        strokeWidth={strokeWidth}
        strokeLinecap="square"
        data-testid="tuplet-right-arm"
      />
    </g>
  )
}

export default TupletBracket
