import uuid
from typing import Any, List, Literal, Optional

import music21

from app.schemas.music import (
    KeySignatureSchema,
    MeasureSchema,
    NoteSchema,
    ScoreMetadataSchema,
    ScoreSchema,
    StaffType,
    TimeSignatureSchema,
)
from app.services.music_domain_helpers import parse_note_element


def parse_midi_bytes(
    midi_data: bytes,
    title: Optional[str] = None,
    composer: Optional[str] = None,
    split_by_pitch: bool = False,
) -> ScoreSchema:
    mf = music21.midi.MidiFile()
    mf.readstr(midi_data)
    stream_score = music21.midi.translate.midiFileToStream(mf)

    # Quantize notes to avoid tiny micro-fractions
    stream_score.quantize(
        quarterLengthDivisors=(4, 3),
        processOffsets=True,
        processDurations=True,
    )

    # Convert to structured measures
    measured_score = stream_score.makeMeasures()

    score_title = title or "Partitura MIDI"
    score_composer = composer or "Desconocido"

    parts_list = list(measured_score.parts) if measured_score.parts else [measured_score]
    is_grand_staff = len(parts_list) >= 2 or split_by_pitch
    staff_type: StaffType = "grand" if is_grand_staff else "single"

    measures_dict: dict[int, dict[str, Any]] = {}

    upper_part = parts_list[0]
    lower_part = parts_list[1] if len(parts_list) >= 2 else None

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

        # Notes in upper part
        note_counter = 0
        for elem in m.notesAndRests:
            if isinstance(elem, music21.harmony.ChordSymbol):
                continue
            note_counter += 1
            note_schema = parse_note_element(elem, m_num, note_counter)

            # If split_by_pitch is enabled and note is in bass range (pitch < C4 / octave < 4)
            if (
                split_by_pitch
                and lower_part is None
                and note_schema.pitch
                and note_schema.pitch.octave < 4
            ):
                if measures_dict[m_num]["lower_notes"] is None:
                    measures_dict[m_num]["lower_notes"] = []
                measures_dict[m_num]["lower_notes"].append(note_schema)
            else:
                measures_dict[m_num]["notes"].append(note_schema)

    # Parse lower part measures if 2 distinct MIDI tracks exist
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
        measure_notes = data["notes"]
        if not measure_notes:
            measure_notes = [
                NoteSchema(id=f"m{m_num}-rest", is_rest=True, duration="whole", dots=0)
            ]
        lower_notes = data["lower_notes"]
        if lower_notes is not None and len(lower_notes) == 0:
            lower_notes = [
                NoteSchema(id=f"m{m_num}-lh-rest", is_rest=True, duration="whole", dots=0)
            ]

        sorted_measures.append(
            MeasureSchema(
                number=data["number"],
                time_signature=data["time_sig"],
                key_signature=data["key_sig"],
                chords=data["chords"],
                notes=measure_notes,
                lower_notes=lower_notes,
            )
        )

    if not sorted_measures:
        time_sig = TimeSignatureSchema(beats=4, beat_type=4)
        key_sig = KeySignatureSchema(fifths=0, mode="major", name="Do Mayor")
        sorted_measures.append(
            MeasureSchema(
                number=1,
                time_signature=time_sig,
                key_signature=key_sig,
                notes=[NoteSchema(id="m1-rest", is_rest=True, duration="whole", dots=0)],
                lower_notes=(
                    [NoteSchema(id="m1-lh-rest", is_rest=True, duration="whole", dots=0)]
                    if staff_type == "grand"
                    else None
                ),
            )
        )

    score_id = str(uuid.uuid4())
    metadata_schema = ScoreMetadataSchema(
        title=score_title,
        composer=score_composer,
    )

    return ScoreSchema(
        id=score_id,
        metadata=metadata_schema,
        staff_type=staff_type,
        measures=sorted_measures,
    )
