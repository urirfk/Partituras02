export type MeasuresPerSystem = 1 | 2 | 3 | 4

export type StaffScale = 'normal' | 'large' | 'extra-large'

export type ChordNotation = 'latin' | 'american'

export interface ScoreDisplayConfig {
  measuresPerSystem: MeasuresPerSystem
  showNoteNames: boolean
  showAccidentals: boolean
  showFingerings: boolean
  showChords: boolean
  showLyrics: boolean
  scale: StaffScale
  transpositionSemitones: number
  chordNotation: ChordNotation
}

export const DEFAULT_SCORE_CONFIG: ScoreDisplayConfig = {
  measuresPerSystem: 2,
  showNoteNames: true,
  showAccidentals: true,
  showFingerings: true,
  showChords: true,
  showLyrics: true,
  scale: 'large',
  transpositionSemitones: 0,
  chordNotation: 'latin',
}

export interface PDFExportOptions {
  orientation: 'portrait' | 'landscape'
  pageSize: 'A4' | 'letter'
  systemsPerPage: number
  leftMarginMm: number
  rightMarginMm: number
  includeHeaderOnEveryPage: boolean
}

export const DEFAULT_PDF_OPTIONS: PDFExportOptions = {
  orientation: 'portrait',
  pageSize: 'A4',
  systemsPerPage: 3,
  leftMarginMm: 15,
  rightMarginMm: 15,
  includeHeaderOnEveryPage: false,
}
