import music21

from app.services.midi_parser import parse_midi_bytes


def create_sample_single_track_midi() -> bytes:
    score = music21.stream.Score()
    part = music21.stream.Part()
    part.append(music21.meter.TimeSignature("4/4"))
    part.append(music21.key.KeySignature(0))

    # Add notes: C4, E4, G4, Rest
    part.append(music21.note.Note("C4", quarterLength=1.0))
    part.append(music21.note.Note("E4", quarterLength=1.0))
    part.append(music21.note.Note("G4", quarterLength=1.0))
    part.append(music21.note.Rest(quarterLength=1.0))

    score.append(part)
    mf = music21.midi.translate.music21ObjectToMidiFile(score)
    return bytes(mf.writestr())


def create_sample_two_track_midi() -> bytes:
    score = music21.stream.Score()

    # Track 1: Treble (C5, D5)
    upper_part = music21.stream.Part()
    upper_part.append(music21.meter.TimeSignature("4/4"))
    upper_part.append(music21.note.Note("C5", quarterLength=2.0))
    upper_part.append(music21.note.Note("D5", quarterLength=2.0))
    score.append(upper_part)

    # Track 2: Bass (C3, G3)
    lower_part = music21.stream.Part()
    lower_part.append(music21.meter.TimeSignature("4/4"))
    lower_part.append(music21.note.Note("C3", quarterLength=2.0))
    lower_part.append(music21.note.Note("G3", quarterLength=2.0))
    score.append(lower_part)

    mf = music21.midi.translate.music21ObjectToMidiFile(score)
    return bytes(mf.writestr())


def test_parse_single_track_midi():
    midi_bytes = create_sample_single_track_midi()
    score = parse_midi_bytes(midi_bytes, title="Melody Test", composer="Chopin")

    assert score.metadata.title == "Melody Test"
    assert score.metadata.composer == "Chopin"
    assert score.staff_type == "single"
    assert len(score.measures) >= 1

    m1 = score.measures[0]
    assert len(m1.notes) == 4

    # Note 1: C4 (do)
    assert m1.notes[0].pitch is not None
    assert m1.notes[0].pitch.step == "C"
    assert m1.notes[0].pitch.solfege == "do"
    assert m1.notes[0].pitch.display_badge_text == "do"

    # Note 2: E4 (mi)
    assert m1.notes[1].pitch is not None
    assert m1.notes[1].pitch.step == "E"
    assert m1.notes[1].pitch.solfege == "mi"

    # Note 3: G4 (sol)
    assert m1.notes[2].pitch is not None
    assert m1.notes[2].pitch.step == "G"
    assert m1.notes[2].pitch.solfege == "sol"

    # Note 4: Rest
    assert m1.notes[3].is_rest


def test_parse_two_track_midi_grand_staff():
    midi_bytes = create_sample_two_track_midi()
    score = parse_midi_bytes(midi_bytes, title="Piano Grand Staff")

    assert score.metadata.title == "Piano Grand Staff"
    assert score.staff_type == "grand"
    assert len(score.measures) >= 1

    m1 = score.measures[0]
    assert len(m1.notes) >= 2
    assert m1.notes[0].pitch is not None
    assert m1.notes[0].pitch.step == "C"
    assert m1.notes[0].pitch.octave == 5

    assert m1.lower_notes is not None
    assert len(m1.lower_notes) >= 2
    assert m1.lower_notes[0].pitch is not None
    assert m1.lower_notes[0].pitch.step == "C"
    assert m1.lower_notes[0].pitch.octave == 3
