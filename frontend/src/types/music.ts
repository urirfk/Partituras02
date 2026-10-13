export type SolfeggioNote = 'do' | 're' | 'mi' | 'fa' | 'sol' | 'la' | 'si'

export type Accidental = 'natural' | 'sharp' | 'flat' | 'double-sharp' | 'double-flat'

export type Step = 'C' | 'D' | 'E' | 'F' | 'G' | 'A' | 'B'

export interface Pitch {
  step: Step
  octave: number
  accidental: Accidental
  solfege: SolfeggioNote
  displayBadgeText: string // e.g. "♭si", "do", "♯fa"
}

export type DurationType = 'whole' | 'half' | 'quarter' | 'eighth' | '16th' | '32nd'

export interface TupletInfo {
  count: number
  total: number
}

export type Fingering = 1 | 2 | 3 | 4 | 5

export interface Note {
  id: string
  pitch?: Pitch
  isRest: boolean
  duration: DurationType
  dots: number
  fingering?: Fingering
  lyrics?: string
  tuplet?: TupletInfo
  tie?: 'start' | 'stop' | 'continue'
}

export interface ChordSymbol {
  id: string
  root: string // e.g. "Si" or "B"
  quality: string // e.g. "m", "7", "5dis(7)"
  fullText: string // e.g. "Si♭7"
  beat: number // beat position within the measure (1-indexed or fractional)
}

export interface TimeSignature {
  beats: number
  beatType: number
}

export interface KeySignature {
  fifths: number // -7 to +7
  mode: 'major' | 'minor'
  name: string // e.g. "Mi♭ Mayor"
}

export interface Measure {
  number: number
  timeSignature?: TimeSignature
  keySignature?: KeySignature
  chords: ChordSymbol[]
  notes: Note[] // treble/lead notes
  lowerNotes?: Note[] // bass clef notes if grand staff
}

export type StaffType = 'single' | 'grand'

export interface ScoreMetadata {
  title: string
  composer: string
  subtitle?: string
  arranger?: string
  tempo?: {
    text?: string
    bpm?: number
  }
}

export interface Score {
  id: string
  metadata: ScoreMetadata
  staffType: StaffType
  measures: Measure[]
}
