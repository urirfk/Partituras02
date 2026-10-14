import {
  ChordSymbol,
  Measure,
  Note,
  Pitch,
  Score,
  StaffType,
} from '../types/music';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function mapPitchFromBackend(raw: any): Pitch | undefined {
  if (!raw) return undefined;
  return {
    step: raw.step,
    octave: raw.octave,
    accidental: raw.accidental || 'natural',
    solfege: raw.solfege,
    displayBadgeText: raw.display_badge_text || raw.displayBadgeText || raw.solfege,
  };
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function mapNoteFromBackend(raw: any): Note {
  return {
    id: raw.id,
    pitch: mapPitchFromBackend(raw.pitch),
    isRest: Boolean(raw.is_rest ?? raw.isRest),
    duration: raw.duration,
    dots: raw.dots ?? 0,
    fingering: raw.fingering,
    lyrics: raw.lyrics,
    tuplet: raw.tuplet
      ? {
          count: raw.tuplet.count,
          total: raw.tuplet.total,
        }
      : undefined,
    tie: raw.tie,
  };
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function mapChordFromBackend(raw: any): ChordSymbol {
  return {
    id: raw.id,
    root: raw.root,
    quality: raw.quality,
    fullText: raw.full_text || raw.fullText || `${raw.root}${raw.quality}`,
    beat: raw.beat ?? 1.0,
  };
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function mapMeasureFromBackend(raw: any): Measure {
  const timeSig = raw.time_signature || raw.timeSignature;
  const keySig = raw.key_signature || raw.keySignature;

  return {
    number: raw.number,
    timeSignature: timeSig
      ? {
          beats: timeSig.beats,
          beatType: timeSig.beat_type || timeSig.beatType,
        }
      : undefined,
    keySignature: keySig
      ? {
          fifths: keySig.fifths,
          mode: keySig.mode || 'major',
          name: keySig.name || 'Do Mayor',
        }
      : undefined,
    chords: Array.isArray(raw.chords) ? raw.chords.map(mapChordFromBackend) : [],
    notes: Array.isArray(raw.notes) ? raw.notes.map(mapNoteFromBackend) : [],
    lowerNotes: Array.isArray(raw.lower_notes || raw.lowerNotes)
      ? (raw.lower_notes || raw.lowerNotes).map(mapNoteFromBackend)
      : undefined,
  };
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function mapScoreFromBackend(raw: any): Score {
  if (!raw) {
    throw new Error('No se recibieron datos de partitura válidos.');
  }

  const staffType: StaffType = (raw.staff_type || raw.staffType) === 'grand' ? 'grand' : 'single';

  return {
    id: raw.id || `score-${Date.now()}`,
    metadata: {
      title: raw.metadata?.title || 'Partitura Sin Título',
      composer: raw.metadata?.composer || 'Desconocido',
      subtitle: raw.metadata?.subtitle,
      arranger: raw.metadata?.arranger,
      tempo: raw.metadata?.tempo_bpm || raw.metadata?.tempo?.bpm
        ? {
            bpm: raw.metadata?.tempo_bpm || raw.metadata?.tempo?.bpm,
            text: raw.metadata?.tempo_text || raw.metadata?.tempo?.text,
          }
        : undefined,
    },
    staffType,
    measures: Array.isArray(raw.measures) ? raw.measures.map(mapMeasureFromBackend) : [],
  };
}

export function mapScoreToBackend(score: Score): Record<string, unknown> {
  return {
    id: score.id,
    metadata: {
      title: score.metadata.title,
      composer: score.metadata.composer,
      subtitle: score.metadata.subtitle,
      arranger: score.metadata.arranger,
      tempo_bpm: score.metadata.tempo?.bpm,
      tempo_text: score.metadata.tempo?.text,
    },
    staff_type: score.staffType,
    measures: score.measures.map((m) => ({
      number: m.number,
      time_signature: m.timeSignature
        ? {
            beats: m.timeSignature.beats,
            beat_type: m.timeSignature.beatType,
          }
        : undefined,
      key_signature: m.keySignature
        ? {
            fifths: m.keySignature.fifths,
            mode: m.keySignature.mode,
            name: m.keySignature.name,
          }
        : undefined,
      chords:
        m.chords?.map((c) => ({
          id: c.id,
          root: c.root,
          quality: c.quality,
          full_text: c.fullText,
          beat: c.beat,
        })) || [],
      notes: m.notes.map((n) => ({
        id: n.id,
        pitch: n.pitch
          ? {
              step: n.pitch.step,
              octave: n.pitch.octave,
              accidental: n.pitch.accidental,
              solfege: n.pitch.solfege,
              display_badge_text: n.pitch.displayBadgeText,
            }
          : undefined,
        is_rest: Boolean(n.isRest),
        duration: n.duration,
        dots: n.dots || 0,
        fingering: n.fingering,
        lyrics: n.lyrics,
        tuplet: n.tuplet
          ? {
              count: n.tuplet.count,
              total: n.tuplet.total,
            }
          : undefined,
        tie: n.tie,
      })),
      lower_notes: m.lowerNotes?.map((n) => ({
        id: n.id,
        pitch: n.pitch
          ? {
              step: n.pitch.step,
              octave: n.pitch.octave,
              accidental: n.pitch.accidental,
              solfege: n.pitch.solfege,
              display_badge_text: n.pitch.displayBadgeText,
            }
          : undefined,
        is_rest: Boolean(n.isRest),
        duration: n.duration,
        dots: n.dots || 0,
        fingering: n.fingering,
        lyrics: n.lyrics,
        tuplet: n.tuplet
          ? {
              count: n.tuplet.count,
              total: n.tuplet.total,
            }
          : undefined,
        tie: n.tie,
      })),
    })),
  };
}
