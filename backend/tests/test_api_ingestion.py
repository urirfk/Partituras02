import io

import music21
from fastapi.testclient import TestClient

from app.main import app

client = TestClient(app)

SAMPLE_MUSICXML = """<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE score-partwise PUBLIC "-//Recordare//DTD MusicXML 3.1 Partwise//EN" "http://www.musicxml.org/dtds/partwise.dtd">
<score-partwise version="3.1">
  <work><work-title>API Test Piece</work-title></work>
  <identification><creator type="composer">Test Composer</creator></identification>
  <part-list>
    <score-part id="P1"><part-name>Piano</part-name></score-part>
  </part-list>
  <part id="P1">
    <measure number="1">
      <attributes>
        <divisions>1</divisions>
        <key><fifths>0</fifths><mode>major</mode></key>
        <time><beats>4</beats><beat-type>4</beat-type></time>
        <clef><sign>G</sign><line>2</line></clef>
      </attributes>
      <note>
        <pitch><step>C</step><octave>4</octave></pitch>
        <duration>4</duration>
        <type>whole</type>
      </note>
    </measure>
  </part>
</score-partwise>
"""


def create_sample_midi_bytes() -> bytes:
    score = music21.stream.Score()
    part = music21.stream.Part()
    m = music21.stream.Measure(number=1)
    m.append(music21.meter.TimeSignature("4/4"))
    n = music21.note.Note("C4", quarterLength=4.0)
    m.append(n)
    part.append(m)
    score.append(part)
    mf = music21.midi.translate.streamToMidiFile(score)
    return bytes(mf.writestr())


def test_import_musicxml_endpoint():
    file_bytes = io.BytesIO(SAMPLE_MUSICXML.encode("utf-8"))
    files = {"file": ("test.musicxml", file_bytes, "application/xml")}
    response = client.post("/api/import-musicxml", files=files)
    assert response.status_code == 200
    data = response.json()
    assert data["metadata"]["title"] == "API Test Piece"
    assert data["metadata"]["composer"] == "Test Composer"
    assert len(data["measures"]) == 1
    assert data["measures"][0]["notes"][0]["pitch"]["solfege"] == "do"


def test_import_musicxml_empty_file():
    files = {"file": ("empty.xml", io.BytesIO(b""), "application/xml")}
    response = client.post("/api/import-musicxml", files=files)
    assert response.status_code == 400


def test_import_midi_endpoint():
    midi_bytes = create_sample_midi_bytes()
    files = {"file": ("sample.mid", io.BytesIO(midi_bytes), "audio/midi")}
    response = client.post("/api/import-midi", files=files)
    assert response.status_code == 200
    data = response.json()
    assert data["metadata"]["title"] == "sample"
    assert len(data["measures"]) >= 1


def test_import_midi_empty_file():
    files = {"file": ("empty.mid", io.BytesIO(b""), "audio/midi")}
    response = client.post("/api/import-midi", files=files)
    assert response.status_code == 400


def test_analyze_harmony_endpoint():
    file_bytes = io.BytesIO(SAMPLE_MUSICXML.encode("utf-8"))
    files = {"file": ("test.musicxml", file_bytes, "application/xml")}
    res_import = client.post("/api/import-musicxml", files=files)
    score_payload = res_import.json()

    # Call /api/analyze-harmony
    response = client.post("/api/analyze-harmony", json=score_payload)
    assert response.status_code == 200
    data = response.json()
    assert "measures" in data
    assert len(data["measures"]) == 1
