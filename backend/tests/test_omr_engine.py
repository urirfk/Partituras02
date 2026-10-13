import cv2
import numpy as np
import pytest

from app.services.omr_engine import (
    get_pitch_from_y,
    process_omr_image,
    process_omr_pages,
)
from app.services.staff_detector import DetectedStaff


def create_synthetic_score_with_notes(
    staff_type: str = "single",
    width: int = 600,
    height: int = 400,
) -> np.ndarray:
    """
    Creates synthetic score with staff lines, barlines, and drawn circular noteheads.
    """
    img = np.full((height, width), 255, dtype=np.uint8)
    line_sp = 12

    # Draw staff 1 (upper)
    top_y = 60
    staff1_lines = [top_y + i * line_sp for i in range(5)]
    for y in staff1_lines:
        cv2.line(img, (40, y), (width - 40, y), 0, 1)

    barline_xs = [40, 280, width - 40]

    if staff_type == "grand":
        # Draw staff 2 (lower)
        lower_top_y = top_y + 4 * line_sp + 50
        staff2_lines = [lower_top_y + i * line_sp for i in range(5)]
        for y in staff2_lines:
            cv2.line(img, (40, y), (width - 40, y), 0, 1)

        # Draw continuous barlines
        for bx in barline_xs:
            cv2.line(img, (bx, staff1_lines[0]), (bx, staff2_lines[4]), 0, 2)

        # Draw noteheads in upper staff (Measure 1: E4 at line 4, G4 at line 2)
        # In staff1_lines: index 4 is bottom line (E4), index 2 is G4
        cv2.circle(img, (100, staff1_lines[4]), 5, 0, -1)
        cv2.circle(img, (180, staff1_lines[2]), 5, 0, -1)

        # Draw noteheads in lower staff (Measure 1: G2 at bottom line 4, C3 at space 2)
        cv2.circle(img, (100, staff2_lines[4]), 5, 0, -1)
        cv2.circle(img, (180, staff2_lines[2]), 5, 0, -1)
    else:
        for bx in barline_xs:
            cv2.line(img, (bx, staff1_lines[0]), (bx, staff1_lines[4]), 0, 2)

        # Measure 1 notes: E4 (bottom line), G4 (line 2)
        cv2.circle(img, (100, staff1_lines[4]), 5, 0, -1)
        cv2.circle(img, (180, staff1_lines[2]), 5, 0, -1)

    return img


def test_get_pitch_from_y():
    staff = DetectedStaff(
        index=0,
        top_y=40,
        bottom_y=88,
        line_spacing=12.0,
        lines=[40, 52, 64, 76, 88],
    )
    # cy at bottom line (88) -> E4
    p_e4 = get_pitch_from_y(88, staff, clef="treble")
    assert p_e4.step == "E"
    assert p_e4.octave == 4
    assert p_e4.solfege == "mi"

    # cy at middle line (64) -> B4
    p_b4 = get_pitch_from_y(64, staff, clef="treble")
    assert p_b4.step == "B"
    assert p_b4.octave == 4
    assert p_b4.solfege == "si"

    # In Bass clef, bottom line (88) -> G2
    p_g2 = get_pitch_from_y(88, staff, clef="bass")
    assert p_g2.step == "G"
    assert p_g2.octave == 2
    assert p_g2.solfege == "sol"


def test_process_omr_image_single_staff():
    img = create_synthetic_score_with_notes(staff_type="single")
    score = process_omr_image(img, title="Estudio Didáctico", composer="Chopin")

    assert score.metadata.title == "Estudio Didáctico"
    assert score.metadata.composer == "Chopin"
    assert score.staff_type == "single"
    assert len(score.measures) >= 2

    # Measure 1 should contain detected notes
    m1 = score.measures[0]
    assert len(m1.notes) >= 2
    # Verify Latin solfège
    solfeges = [n.pitch.solfege for n in m1.notes if n.pitch]
    assert "mi" in solfeges or "sol" in solfeges


def test_process_omr_image_grand_staff():
    img = create_synthetic_score_with_notes(staff_type="grand")
    score = process_omr_image(img, title="Piano Grand Staff", composer="Bach")

    assert score.staff_type == "grand"
    assert len(score.measures) >= 2

    m1 = score.measures[0]
    assert m1.lower_notes is not None
    assert len(m1.notes) >= 1
    assert len(m1.lower_notes) >= 1


def test_process_omr_image_bytes():
    img = create_synthetic_score_with_notes(staff_type="single")
    _, buf = cv2.imencode(".png", img)
    score = process_omr_image(buf.tobytes())
    assert score is not None
    assert len(score.measures) >= 1


def test_process_omr_image_empty():
    blank = np.full((300, 300), 255, dtype=np.uint8)
    score = process_omr_image(blank)
    assert score is not None
    assert len(score.measures) == 1
    assert score.measures[0].notes[0].is_rest is True


def test_process_omr_pages_multipage():
    p1 = create_synthetic_score_with_notes(staff_type="single")
    p2 = create_synthetic_score_with_notes(staff_type="single")

    score = process_omr_pages([p1, p2], title="Obra Multipágina")
    assert score.metadata.title == "Obra Multipágina"
    assert len(score.measures) >= 4
    # Sequential measure numbering verification
    for idx, m in enumerate(score.measures):
        assert m.number == idx + 1


def test_process_omr_pages_empty_list():
    with pytest.raises(ValueError, match="No se proporcionaron páginas"):
        process_omr_pages([])
