from typing import Any, Literal, Optional

import music21

from app.schemas.music import (
    Accidental,
    DurationType,
    NoteSchema,
    PitchSchema,
    SolfeggioNote,
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

    # Tie or Slur info
    tie_type: Optional[Literal["start", "stop", "continue"]] = None
    if (
        hasattr(element, "tie")
        and element.tie is not None
        and getattr(element.tie, "type", None) in ("start", "stop", "continue")
    ):
        tie_type = element.tie.type
    elif hasattr(element, "getSpannerSites"):
        for sp in element.getSpannerSites():
            if isinstance(sp, music21.spanner.Slur):
                if sp.isFirst(element):
                    tie_type = "start"
                    break
                elif sp.isLast(element):
                    tie_type = "stop"
                    break
                else:
                    tie_type = "continue"
                    break

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
        tie=tie_type,
    )
