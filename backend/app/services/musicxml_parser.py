import uuid
from typing import Any, List, Literal, Optional

import music21

from app.schemas.music import (
    Accidental,
    ChordSymbolSchema,
    DurationType,
    KeySignatureSchema,
    MeasureSchema,
    NoteSchema,
    PitchSchema,
    ScoreMetadataSchema,
    ScoreSchema,
    SolfeggioNote,
    StaffType,
    TimeSignatureSchema,
    TupletInfoSchema,
)

STEP_TO_SOLFEGE: dict[str, SolfeggioNote] = {
    "C": "do",
    "D": "re",
    "E": "mi",
    "F": "fa",
    "G": "sol",
    "A": "la",
    "B": "si",
}

AMERICAN_TO_LATIN_ROOTS: dict[str, str] = {
    "C": "Do",
    "D": "Re",
    "E": "Mi",
    "F": "Fa",
    "G": "Sol",
    "A": "La",
    "B": "Si",
}

DURATION_MAP: dict[str, DurationType] = {
    "whole": "whole",
    "half": "half",
    "quarter": "quarter",
    "eighth": "eighth",
    "16th": "16th",
    "32nd": "32nd",
}


def map_alter_to_accidental(alter: Optional[float]) -> Accidental:
    if alter is None or alter == 0:
        return "natural"
    if alter == 1:
        return "sharp"
    if alter == -1:
        return "flat"
    if alter == 2:
        return "double-sharp"
    if alter == -2:
        return "double-flat"
    return "natural"


def create_pitch_schema(pitch: music21.pitch.Pitch) -> PitchSchema:
    step = pitch.step
    if step not in STEP_TO_SOLFEGE:
        step = "C"
    solfege = STEP_TO_SOLFEGE[step]
    accidental = map_alter_to_accidental(pitch.alter)

    if accidental == "flat":
        display_text = f"♭{solfege}"
    elif accidental == "sharp":
        display_text = f"♯{solfege}"
    elif accidental == "double-flat":
        display_text = f"𝄫{solfege}"
    elif accidental == "double-sharp":
        display_text = f"𝄪{solfege}"
    else:
        display_text = solfege

    return PitchSchema(
        step=step,  # type: ignore[arg-type]
        octave=pitch.octave if pitch.octave is not None else 4,
        accidental=accidental,
        solfege=solfege,
        display_badge_text=display_text,
    )


def parse_note_element(
    element: Any,
    measure_number: int,
    note_idx: int,
) -> NoteSchema:
    note_id = f"m{measure_number}-n{note_idx}"
    dots = element.duration.dots if hasattr(element, "duration") else 0
    duration_type_str = element.duration.type if hasattr(element, "duration") else "quarter"
    duration: DurationType = DURATION_MAP.get(duration_type_str, "quarter")

    # Rest note
    if element.isRest:
        return NoteSchema(
            id=note_id,
            is_rest=True,
            duration=duration,
            dots=dots,
        )

    # Tuplet info
    tuplet_info: Optional[TupletInfoSchema] = None
    if hasattr(element, "duration") and element.duration.tuplets:
        t = element.duration.tuplets[0]
        actual = t.actualNumber if t.actualNumber else 3
        tuplet_info = TupletInfoSchema(count=1, total=actual)

    # Lyrics
    lyrics_text: Optional[str] = None
    if hasattr(element, "lyric") and element.lyric:
        lyrics_text = element.lyric
    elif hasattr(element, "lyrics") and element.lyrics:
        lyrics_text = element.lyrics[0].text

    # Pitch
    pitch_schema: Optional[PitchSchema] = None
    if hasattr(element, "pitch"):
        pitch_schema = create_pitch_schema(element.pitch)
    elif hasattr(element, "pitches") and element.pitches:
        pitch_schema = create_pitch_schema(element.pitches[-1])

    return NoteSchema(
        id=note_id,
        pitch=pitch_schema,
        is_rest=False,
        duration=duration,
        dots=dots,
        lyrics=lyrics_text,
        tuplet=tuplet_info,
    )


def parse_chord_symbol(h: Any, chord_idx: int) -> Optional[ChordSymbolSchema]:
    try:
        root_str = h.root().name if callable(getattr(h, "root", None)) else "C"
        root_step = root_str[0]
        latin_root = AMERICAN_TO_LATIN_ROOTS.get(root_step, "Do")
        if len(root_str) > 1:
            if "-" in root_str or "b" in root_str:
                latin_root += "♭"
            elif "#" in root_str:
                latin_root += "♯"

        figure = getattr(h, "figure", root_str)
        quality = getattr(h, "chordStepModifications", "") or ""

        # Build full text e.g. "Si♭7"
        full_text = latin_root
        suffix = figure.replace(root_str, "")
        if suffix:
            full_text += suffix

        beat = float(h.beat) if hasattr(h, "beat") else 1.0

        return ChordSymbolSchema(
            id=f"c-{chord_idx}",
            root=latin_root,
            quality=str(quality),
            full_text=full_text,
            beat=beat,
        )
    except Exception:
        return None


def parse_musicxml_content(content: str | bytes) -> ScoreSchema:
    if isinstance(content, bytes):
        content_str = content.decode("utf-8", errors="replace")
    else:
        content_str = content

    parsed_score = music21.converter.parseData(content_str, format="musicxml")

    # Extract metadata
    title = "Partitura Didáctica"
    composer = "Desconocido"
    if parsed_score.metadata:
        if parsed_score.metadata.title:
            title = parsed_score.metadata.title
        if parsed_score.metadata.composer:
            composer = parsed_score.metadata.composer

    # Determine staff topology (Single Staff vs Grand Staff)
    parts_attr = getattr(parsed_score, "parts", [])
    parts: List[Any] = list(parts_attr) if parts_attr else []
    is_grand_staff = len(parts) >= 2
    staff_type: StaffType = "grand" if is_grand_staff else "single"

    measures_dict: dict[int, dict[str, Any]] = {}

    upper_part = parts[0] if len(parts) > 0 else parsed_score
    lower_part = parts[1] if len(parts) > 1 else None

    # Parse upper part measures
    for m in upper_part.getElementsByClass(music21.stream.Measure):
        m_num = m.number if m.number else 1
        if m_num not in measures_dict:
            measures_dict[m_num] = {
                "number": m_num,
                "notes": [],
                "lower_notes": [] if is_grand_staff else None,
                "chords": [],
                "time_sig": None,
                "key_sig": None,
            }

        # Key signature
        if m.keySignature:
            fifths = getattr(m.keySignature, "sharps", 0)
            mode_literal: Literal["major", "minor"] = (
                "minor" if getattr(m.keySignature, "mode", "major") == "minor" else "major"
            )
            name_str = getattr(m.keySignature, "name", f"{fifths} alteraciones") or "Do Mayor"
            measures_dict[m_num]["key_sig"] = KeySignatureSchema(
                fifths=fifths,
                mode=mode_literal,
                name=name_str,
            )

        # Time signature
        if m.timeSignature:
            measures_dict[m_num]["time_sig"] = TimeSignatureSchema(
                beats=m.timeSignature.numerator,
                beat_type=m.timeSignature.denominator,
            )

        # Harmony / Chord symbols
        chord_counter = 0
        for h in m.getElementsByClass(music21.harmony.ChordSymbol):
            chord_counter += 1
            cs = parse_chord_symbol(h, chord_counter)
            if cs:
                measures_dict[m_num]["chords"].append(cs)

        # Upper notes
        note_counter = 0
        for elem in m.notesAndRests:
            if isinstance(elem, music21.harmony.ChordSymbol):
                continue
            note_counter += 1
            note_schema = parse_note_element(elem, m_num, note_counter)
            measures_dict[m_num]["notes"].append(note_schema)

    # Parse lower part measures if Grand Staff
    if lower_part:
        for m in lower_part.getElementsByClass(music21.stream.Measure):
            m_num = m.number if m.number else 1
            if m_num not in measures_dict:
                measures_dict[m_num] = {
                    "number": m_num,
                    "notes": [],
                    "lower_notes": [],
                    "chords": [],
                    "time_sig": None,
                    "key_sig": None,
                }
            if measures_dict[m_num]["lower_notes"] is None:
                measures_dict[m_num]["lower_notes"] = []

            note_counter = 0
            for elem in m.notesAndRests:
                if isinstance(elem, music21.harmony.ChordSymbol):
                    continue
                note_counter += 1
                note_schema = parse_note_element(elem, m_num, note_counter)
                measures_dict[m_num]["lower_notes"].append(note_schema)

    # Assemble MeasureSchema objects
    sorted_measures: List[MeasureSchema] = []
    for m_num in sorted(measures_dict.keys()):
        data = measures_dict[m_num]
        sorted_measures.append(
            MeasureSchema(
                number=data["number"],
                time_signature=data["time_sig"],
                key_signature=data["key_sig"],
                chords=data["chords"],
                notes=data["notes"],
                lower_notes=data["lower_notes"],
            )
        )

    score_id = str(uuid.uuid4())
    metadata_schema = ScoreMetadataSchema(
        title=title,
        composer=composer,
    )

    return ScoreSchema(
        id=score_id,
        metadata=metadata_schema,
        staff_type=staff_type,
        measures=sorted_measures,
    )
