from app.services.musicxml_parser import parse_musicxml_content

SAMPLE_LEAD_SHEET_MUSICXML = """<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE score-partwise PUBLIC "-//Recordare//DTD MusicXML 3.1 Partwise//EN" "http://www.musicxml.org/dtds/partwise.dtd">
<score-partwise version="3.1">
  <work>
    <work-title>Test EZ-Play Lead Sheet</work-title>
  </work>
  <identification>
    <creator type="composer">Didactic Composer</creator>
  </identification>
  <part-list>
    <score-part id="P1">
      <part-name>Melody</part-name>
    </score-part>
  </part-list>
  <part id="P1">
    <measure number="1">
      <attributes>
        <divisions>1</divisions>
        <key>
          <fifths>-3</fifths>
          <mode>major</mode>
        </key>
        <time>
          <beats>4</beats>
          <beat-type>4</beat-type>
        </time>
        <clef>
          <sign>G</sign>
          <line>2</line>
        </clef>
      </attributes>
      <harmony>
        <root>
          <root-step>B</root-step>
          <root-alter>-1</root-alter>
        </root>
        <kind>major</kind>
      </harmony>
      <note>
        <pitch>
          <step>E</step>
          <alter>0</alter>
          <octave>4</octave>
        </pitch>
        <duration>1</duration>
        <type>quarter</type>
        <lyric number="1">
          <text>gar-</text>
        </lyric>
      </note>
      <note>
        <pitch>
          <step>B</step>
          <alter>-1</alter>
          <octave>4</octave>
        </pitch>
        <duration>1</duration>
        <type>quarter</type>
      </note>
      <note>
        <rest/>
        <duration>2</duration>
        <type>half</type>
      </note>
    </measure>
  </part>
</score-partwise>
"""

SAMPLE_GRAND_STAFF_MUSICXML = """<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE score-partwise PUBLIC "-//Recordare//DTD MusicXML 3.1 Partwise//EN" "http://www.musicxml.org/dtds/partwise.dtd">
<score-partwise version="3.1">
  <work>
    <work-title>Piano Grand Staff Test</work-title>
  </work>
  <identification>
    <creator type="composer">J. S. Bach</creator>
  </identification>
  <part-list>
    <score-part id="P1"><part-name>Right Hand</part-name></score-part>
    <score-part id="P2"><part-name>Left Hand</part-name></score-part>
  </part-list>
  <part id="P1">
    <measure number="1">
      <attributes>
        <divisions>1</divisions>
        <time><beats>4</beats><beat-type>4</beat-type></time>
        <clef><sign>G</sign><line>2</line></clef>
      </attributes>
      <note>
        <pitch><step>C</step><octave>5</octave></pitch>
        <duration>4</duration>
        <type>whole</type>
      </note>
    </measure>
  </part>
  <part id="P2">
    <measure number="1">
      <attributes>
        <divisions>1</divisions>
        <time><beats>4</beats><beat-type>4</beat-type></time>
        <clef><sign>F</sign><line>4</line></clef>
      </attributes>
      <note>
        <pitch><step>C</step><octave>3</octave></pitch>
        <duration>2</duration>
        <type>half</type>
      </note>
      <note>
        <pitch><step>G</step><octave>3</octave></pitch>
        <duration>2</duration>
        <type>half</type>
      </note>
    </measure>
  </part>
</score-partwise>
"""


def test_parse_lead_sheet_musicxml():
    score = parse_musicxml_content(SAMPLE_LEAD_SHEET_MUSICXML)

    assert score.metadata.title == "Test EZ-Play Lead Sheet"
    assert score.metadata.composer == "Didactic Composer"
    assert score.staff_type == "single"
    assert len(score.measures) == 1

    m1 = score.measures[0]
    assert m1.number == 1
    assert m1.time_signature is not None
    assert m1.time_signature.beats == 4
    assert m1.time_signature.beat_type == 4

    assert m1.key_signature is not None
    assert m1.key_signature.fifths == -3

    # Check Notes
    assert len(m1.notes) == 3

    # Note 1: E4 (mi)
    n1 = m1.notes[0]
    assert not n1.is_rest
    assert n1.pitch is not None
    assert n1.pitch.step == "E"
    assert n1.pitch.solfege == "mi"
    assert n1.pitch.display_badge_text == "mi"
    assert n1.lyrics == "gar-"

    # Note 2: B♭4 (♭si)
    n2 = m1.notes[1]
    assert not n2.is_rest
    assert n2.pitch is not None
    assert n2.pitch.step == "B"
    assert n2.pitch.accidental == "flat"
    assert n2.pitch.solfege == "si"
    assert n2.pitch.display_badge_text == "♭si"

    # Note 3: Rest
    n3 = m1.notes[2]
    assert n3.is_rest
    assert n3.duration == "half"

    # Chords
    assert len(m1.chords) >= 1
    assert "Si" in m1.chords[0].root or "B" in m1.chords[0].root


def test_parse_grand_staff_musicxml():
    score = parse_musicxml_content(SAMPLE_GRAND_STAFF_MUSICXML)

    assert score.metadata.title == "Piano Grand Staff Test"
    assert score.metadata.composer == "J. S. Bach"
    assert score.staff_type == "grand"
    assert len(score.measures) == 1

    m1 = score.measures[0]
    assert len(m1.notes) == 1
    assert m1.notes[0].pitch is not None
    assert m1.notes[0].pitch.step == "C"
    assert m1.notes[0].pitch.solfege == "do"

    assert m1.lower_notes is not None
    assert len(m1.lower_notes) == 2
    assert m1.lower_notes[0].pitch is not None
    assert m1.lower_notes[0].pitch.step == "C"
    assert m1.lower_notes[0].pitch.solfege == "do"
    assert m1.lower_notes[1].pitch is not None
    assert m1.lower_notes[1].pitch.step == "G"
    assert m1.lower_notes[1].pitch.solfege == "sol"
