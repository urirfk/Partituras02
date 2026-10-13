from app.schemas.music import (
    MeasureSchema,
    NoteSchema,
    PitchSchema,
    ScoreMetadataSchema,
    ScoreSchema,
)
from app.services.harmonic_analysis import (
    analyze_score_harmonies,
    format_latin_chord,
    infer_chord_from_pitches,
    infer_measure_chords,
)


def test_format_latin_chord():
    latin_root, full_text = format_latin_chord("C", "C")
    assert latin_root == "Do"
    assert full_text == "Do"

    latin_root, full_text = format_latin_chord("B-7", "B-")
    assert latin_root == "Si♭"
    assert full_text == "Si♭7"

    latin_root, full_text = format_latin_chord("Cm", "C")
    assert latin_root == "Do"
    assert full_text == "Dom"

    latin_root, full_text = format_latin_chord("G7", "G")
    assert latin_root == "Sol"
    assert full_text == "Sol7"


def test_infer_chord_from_pitches():
    # C major triad
    cs_c = infer_chord_from_pitches(["C3", "E4", "G4"], chord_id="c-1")
    assert cs_c is not None
    assert cs_c.root == "Do"
    assert cs_c.full_text == "Do"

    # B-flat 7 (Si bemol 7)
    cs_bb7 = infer_chord_from_pitches(["B-2", "D4", "F4", "A-4"], chord_id="c-2")
    assert cs_bb7 is not None
    assert cs_bb7.root == "Si♭"
    assert cs_bb7.full_text == "Si♭7"


def test_infer_measure_chords():
    measure = MeasureSchema(
        number=1,
        notes=[
            NoteSchema(
                id="n1",
                pitch=PitchSchema(
                    step="E",
                    octave=4,
                    accidental="natural",
                    solfege="mi",
                    display_badge_text="mi",
                ),
                duration="quarter",
            )
        ],
        lower_notes=[
            NoteSchema(
                id="l1",
                pitch=PitchSchema(
                    step="C",
                    octave=3,
                    accidental="natural",
                    solfege="do",
                    display_badge_text="do",
                ),
                duration="half",
            ),
            NoteSchema(
                id="l2",
                pitch=PitchSchema(
                    step="G",
                    octave=3,
                    accidental="natural",
                    solfege="sol",
                    display_badge_text="sol",
                ),
                duration="half",
            ),
        ],
    )

    chords = infer_measure_chords(measure)
    assert len(chords) == 1
    assert chords[0].root == "Do"
    assert chords[0].full_text == "Do"


def test_analyze_score_harmonies():
    measure = MeasureSchema(
        number=34,
        notes=[
            NoteSchema(
                id="n1",
                pitch=PitchSchema(
                    step="E",
                    octave=4,
                    accidental="flat",
                    solfege="mi",
                    display_badge_text="♭mi",
                ),
                duration="quarter",
            )
        ],
        lower_notes=[
            NoteSchema(
                id="l1",
                pitch=PitchSchema(
                    step="C",
                    octave=3,
                    accidental="natural",
                    solfege="do",
                    display_badge_text="do",
                ),
                duration="quarter",
            ),
            NoteSchema(
                id="l2",
                pitch=PitchSchema(
                    step="G",
                    octave=3,
                    accidental="natural",
                    solfege="sol",
                    display_badge_text="sol",
                ),
                duration="quarter",
            ),
        ],
    )

    score = ScoreSchema(
        id="s1",
        metadata=ScoreMetadataSchema(title="Analysis Test", composer="Test"),
        staff_type="grand",
        measures=[measure],
    )

    enriched_score = analyze_score_harmonies(score)
    assert len(enriched_score.measures[0].chords) == 1
    assert enriched_score.measures[0].chords[0].root == "Do"
    assert enriched_score.measures[0].chords[0].full_text == "Dom"
