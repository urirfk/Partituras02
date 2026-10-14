from fastapi.testclient import TestClient

from app.main import app
from app.schemas.music import (
    MeasureSchema,
    NoteSchema,
    PitchSchema,
    ScoreMetadataSchema,
    ScoreSchema,
    TimeSignatureSchema,
)
from app.services.export_service import export_to_midi, export_to_musicxml

client = TestClient(app)


def get_sample_score(is_grand: bool = True) -> ScoreSchema:
    upper_notes = [
        NoteSchema(
            id="n1",
            pitch=PitchSchema(
                step="C",
                octave=4,
                accidental="natural",
                solfege="do",
                display_badge_text="do",
            ),
            duration="quarter",
            fingering=1,
            lyrics="Do",
        ),
        NoteSchema(
            id="n2",
            pitch=PitchSchema(
                step="E",
                octave=4,
                accidental="natural",
                solfege="mi",
                display_badge_text="mi",
            ),
            duration="quarter",
            fingering=3,
        ),
        NoteSchema(
            id="n3",
            pitch=PitchSchema(
                step="G",
                octave=4,
                accidental="sharp",
                solfege="sol",
                display_badge_text="♯sol",
            ),
            duration="half",
        ),
    ]

    lower_notes = (
        [
            NoteSchema(
                id="l1",
                pitch=PitchSchema(
                    step="C",
                    octave=3,
                    accidental="natural",
                    solfege="do",
                    display_badge_text="do",
                ),
                duration="whole",
                fingering=5,
            )
        ]
        if is_grand
        else None
    )

    measure = MeasureSchema(
        number=1,
        time_signature=TimeSignatureSchema(beats=4, beat_type=4),
        notes=upper_notes,
        lower_notes=lower_notes,
    )

    return ScoreSchema(
        id="test-score-1",
        metadata=ScoreMetadataSchema(
            title="Himno Didáctico",
            composer="EZ-Play Maestro",
            tempo_bpm=96,
        ),
        staff_type="grand" if is_grand else "single",
        measures=[measure],
    )


def test_export_to_musicxml_service() -> None:
    score = get_sample_score()
    xml_str = export_to_musicxml(score)
    assert "<score-partwise" in xml_str
    assert "Himno Didáctico" in xml_str
    assert "EZ-Play Maestro" in xml_str
    assert "</score-partwise>" in xml_str


def test_export_to_midi_service() -> None:
    score = get_sample_score()
    midi_bytes = export_to_midi(score)
    assert len(midi_bytes) > 20
    assert midi_bytes[:4] == b"MThd"


def test_api_export_musicxml_endpoint() -> None:
    score = get_sample_score()
    payload = score.model_dump(mode="json")
    response = client.post("/api/export-musicxml", json=payload)
    assert response.status_code == 200
    assert "application/vnd.recordare.musicxml+xml" in response.headers["content-type"]
    assert "himno_did_ctico.musicxml" in response.headers.get("content-disposition", "")
    assert "<score-partwise" in response.text


def test_api_export_midi_endpoint() -> None:
    score = get_sample_score()
    payload = score.model_dump(mode="json")
    response = client.post("/api/export-midi", json=payload)
    assert response.status_code == 200
    assert "audio/midi" in response.headers["content-type"]
    assert "himno_did_ctico.mid" in response.headers.get("content-disposition", "")
    assert response.content[:4] == b"MThd"
