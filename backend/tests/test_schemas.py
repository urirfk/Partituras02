from app.schemas.music import (
    ChordSymbolSchema,
    MeasureSchema,
    NoteSchema,
    PitchSchema,
    ScoreMetadataSchema,
    ScoreSchema,
)
from app.schemas.score_config import ScoreDisplayConfigSchema


def test_score_schema_validation_and_serialization() -> None:
    """Verify that ScoreSchema serializes and validates correctly against the domain contracts."""
    pitch_mi = PitchSchema(
        step="E",
        octave=4,
        accidental="flat",
        solfege="mi",
        display_badge_text="mi",
    )

    note_mi = NoteSchema(
        id="n34-1",
        pitch=pitch_mi,
        is_rest=False,
        duration="quarter",
        dots=0,
        fingering=3,
        lyrics="gar-",
    )

    chord_sib = ChordSymbolSchema(
        id="c34-1",
        root="Si",
        quality="b",
        full_text="Si♭",
        beat=1.0,
    )

    measure_34 = MeasureSchema(
        number=34,
        chords=[chord_sib],
        notes=[note_mi],
    )

    score = ScoreSchema(
        id="score-001",
        metadata=ScoreMetadataSchema(
            title="Ejemplo Didáctico",
            composer="Tradicional",
            tempo_bpm=80,
            tempo_text="Andante",
        ),
        staff_type="single",
        measures=[measure_34],
    )

    data = score.model_dump()
    assert data["id"] == "score-001"
    assert data["metadata"]["title"] == "Ejemplo Didáctico"
    assert len(data["measures"]) == 1
    assert data["measures"][0]["notes"][0]["pitch"]["solfege"] == "mi"
    assert data["measures"][0]["notes"][0]["fingering"] == 3
    assert data["measures"][0]["chords"][0]["full_text"] == "Si♭"


def test_score_display_config_defaults_adhere_to_spec() -> None:
    """Verify that ScoreDisplayConfig defaults match the specifications."""
    config = ScoreDisplayConfigSchema()
    assert config.measures_per_system == 2
    assert config.show_note_names is True
    assert config.show_accidentals is True
    assert config.show_fingerings is True
    assert config.scale == "large"
    assert config.chord_notation == "latin"
