from typing import List, Optional

import music21

from app.schemas.music import ChordSymbolSchema, MeasureSchema, ScoreSchema
from app.services.music_domain_helpers import AMERICAN_TO_LATIN_ROOTS


def format_latin_chord(figure: str, root_name: str) -> tuple[str, str]:
    """
    Converts a music21 chord figure (e.g. 'B-7', 'Cm', 'G7')
    into a didactic Latin root ('Si♭', 'Do', 'Sol') and full text ('Si♭7', 'Dom', 'Sol7').
    """
    step = root_name[0]
    latin_root = AMERICAN_TO_LATIN_ROOTS.get(step, "Do")
    if "-" in root_name or "b" in root_name:
        latin_root += "♭"
    elif "#" in root_name:
        latin_root += "♯"

    suffix = figure.replace(root_name, "")
    full_text = latin_root + suffix
    return latin_root, full_text


def pitch_schema_to_m21_name(step: str, octave: int, accidental: str) -> str:
    acc_char = ""
    if accidental == "flat":
        acc_char = "-"
    elif accidental == "sharp":
        acc_char = "#"
    elif accidental == "double-flat":
        acc_char = "--"
    elif accidental == "double-sharp":
        acc_char = "##"
    return f"{step}{acc_char}{octave}"


def infer_chord_from_pitches(
    pitch_strings: List[str],
    chord_id: str,
    beat: float = 1.0,
) -> Optional[ChordSymbolSchema]:
    if not pitch_strings or len(pitch_strings) < 2:
        return None

    try:
        c = music21.chord.Chord(pitch_strings)
        cs = music21.harmony.chordSymbolFromChord(c)
        root_name = cs.root().name
        latin_root, full_text = format_latin_chord(cs.figure, root_name)
        quality = getattr(cs, "chordStepModifications", "") or ""

        return ChordSymbolSchema(
            id=chord_id,
            root=latin_root,
            quality=str(quality),
            full_text=full_text,
            beat=beat,
        )
    except Exception:
        return None


def infer_measure_chords(measure: MeasureSchema) -> List[ChordSymbolSchema]:
    """
    Infers harmonic chord symbols for a single measure from its upper and lower notes.
    """
    if measure.chords:
        return measure.chords

    # Gather notes across staves
    all_notes = list(measure.notes)
    if measure.lower_notes:
        all_notes.extend(measure.lower_notes)

    # Collect pitch strings
    pitch_strings: List[str] = []
    for note in all_notes:
        if not note.is_rest and note.pitch:
            p_str = pitch_schema_to_m21_name(
                note.pitch.step,
                note.pitch.octave,
                note.pitch.accidental,
            )
            pitch_strings.append(p_str)

    if len(pitch_strings) < 2:
        return []

    # Infer primary chord for beat 1
    chord_schema = infer_chord_from_pitches(
        pitch_strings,
        chord_id=f"inferred-m{measure.number}-1",
        beat=1.0,
    )

    if chord_schema:
        return [chord_schema]
    return []


def analyze_score_harmonies(
    score: ScoreSchema,
    override_existing: bool = False,
) -> ScoreSchema:
    """
    Runs assisted harmonic analysis over all measures in the score,
    injecting didactic chord symbols where missing.
    """
    updated_measures: List[MeasureSchema] = []

    for m in score.measures:
        if override_existing or not m.chords:
            inferred = infer_measure_chords(m)
            m_copy = m.model_copy(update={"chords": inferred})
            updated_measures.append(m_copy)
        else:
            updated_measures.append(m)

    return score.model_copy(update={"measures": updated_measures})
