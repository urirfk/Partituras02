import tempfile
from typing import Optional

import music21

from app.schemas.music import NoteSchema, ScoreSchema

DURATION_TYPE_TO_QUARTERS = {
    "whole": 4.0,
    "half": 2.0,
    "quarter": 1.0,
    "eighth": 0.5,
    "16th": 0.25,
    "32nd": 0.125,
}

ACCIDENTAL_TO_M21 = {
    "natural": "",
    "sharp": "#",
    "flat": "-",
    "double-sharp": "##",
    "double-flat": "--",
}


def _create_note_or_rest(note_schema: NoteSchema) -> music21.note.GeneralNote:
    base_ql = DURATION_TYPE_TO_QUARTERS.get(note_schema.duration, 1.0)
    ql = base_ql
    if note_schema.dots == 1:
        ql *= 1.5
    elif note_schema.dots == 2:
        ql *= 1.75

    if note_schema.tuplet:
        # Standard triplet: 3 notes in time of 2
        if note_schema.tuplet.total == 3:
            ql = (ql * 2.0) / 3.0

    if note_schema.is_rest or not note_schema.pitch:
        rest = music21.note.Rest(quarterLength=ql)
        return rest

    p = note_schema.pitch
    acc_str = ACCIDENTAL_TO_M21.get(p.accidental, "")
    pitch_name = f"{p.step}{acc_str}{p.octave}"

    n = music21.note.Note(pitch_name, quarterLength=ql)

    if note_schema.lyrics:
        n.lyric = note_schema.lyrics

    if note_schema.fingering:
        n.articulations.append(music21.articulations.Fingering(note_schema.fingering))

    return n


def score_schema_to_music21(score: ScoreSchema) -> music21.stream.Score:
    m21_score = music21.stream.Score()
    m21_score.metadata = music21.metadata.Metadata()
    m21_score.metadata.title = score.metadata.title
    m21_score.metadata.composer = score.metadata.composer
    if score.metadata.subtitle:
        m21_score.metadata.subtitle = score.metadata.subtitle

    is_grand = score.staff_type == "grand" or any(
        m.lower_notes and len(m.lower_notes) > 0 for m in score.measures
    )

    upper_part = music21.stream.Part(id="P1")
    upper_part.partName = "Piano Right" if is_grand else "Lead"
    lower_part: Optional[music21.stream.Part] = None

    if is_grand:
        lower_part = music21.stream.Part(id="P2")
        lower_part.partName = "Piano Left"

    for m_idx, m_schema in enumerate(score.measures):
        upper_m = music21.stream.Measure(number=m_schema.number)
        lower_m = music21.stream.Measure(number=m_schema.number) if is_grand else None

        # Add clefs on first measure
        if m_idx == 0:
            upper_m.append(music21.clef.TrebleClef())
            if lower_m is not None:
                lower_m.append(music21.clef.BassClef())

        # Time Signature
        if m_schema.time_signature:
            ts = music21.meter.TimeSignature(
                f"{m_schema.time_signature.beats}/{m_schema.time_signature.beat_type}"
            )
            upper_m.append(ts)
            if lower_m is not None:
                lower_m.append(
                    music21.meter.TimeSignature(
                        f"{m_schema.time_signature.beats}/{m_schema.time_signature.beat_type}"
                    )
                )

        # Key Signature
        if m_schema.key_signature:
            ks = music21.key.KeySignature(m_schema.key_signature.fifths)
            upper_m.append(ks)
            if lower_m is not None:
                lower_m.append(music21.key.KeySignature(m_schema.key_signature.fifths))

        # Tempo (on first measure if specified)
        if m_idx == 0 and score.metadata.tempo_bpm:
            upper_m.append(music21.tempo.MetronomeMark(number=score.metadata.tempo_bpm))

        # Chords
        for chord in m_schema.chords:
            try:
                # Normalize root name from Latin or English
                chord_sym = music21.harmony.ChordSymbol(chord.root)
                chord_sym.offset = max(0.0, (chord.beat - 1.0))
                upper_m.append(chord_sym)
            except Exception:
                # If chord root parsing fails, append text expression
                txt = music21.expressions.TextExpression(chord.full_text)
                txt.offset = max(0.0, (chord.beat - 1.0))
                upper_m.append(txt)

        # Upper Notes
        for note_schema in m_schema.notes:
            upper_m.append(_create_note_or_rest(note_schema))

        upper_part.append(upper_m)

        # Lower Notes if Grand Staff
        if is_grand and lower_m is not None and lower_part is not None:
            if m_schema.lower_notes:
                for note_schema in m_schema.lower_notes:
                    lower_m.append(_create_note_or_rest(note_schema))
            lower_part.append(lower_m)

    m21_score.append(upper_part)
    if is_grand and lower_part is not None:
        m21_score.append(lower_part)
        staff_group = music21.layout.StaffGroup(
            [upper_part, lower_part],
            name="Piano",
            abbreviation="Pno.",
            symbol="brace",
            barTogether=True,
        )
        m21_score.insert(0, staff_group)

    return m21_score


def export_to_musicxml(score: ScoreSchema) -> str:
    m21_score = score_schema_to_music21(score)
    with tempfile.NamedTemporaryFile(suffix=".musicxml", delete=True) as tmp:
        m21_score.write("musicxml", fp=tmp.name)
        with open(tmp.name, "r", encoding="utf-8") as f:
            return f.read()


def export_to_midi(score: ScoreSchema) -> bytes:
    m21_score = score_schema_to_music21(score)
    with tempfile.NamedTemporaryFile(suffix=".mid", delete=True) as tmp:
        m21_score.write("midi", fp=tmp.name)
        with open(tmp.name, "rb") as f:
            return f.read()
