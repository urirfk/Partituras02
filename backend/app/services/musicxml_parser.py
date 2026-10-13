import uuid
from typing import Any, List, Literal, Optional

import music21

from app.schemas.music import (
    ChordSymbolSchema,
    KeySignatureSchema,
    MeasureSchema,
    ScoreMetadataSchema,
    ScoreSchema,
    StaffType,
    TimeSignatureSchema,
)
from app.services.music_domain_helpers import (
    AMERICAN_TO_LATIN_ROOTS,
    parse_note_element,
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
