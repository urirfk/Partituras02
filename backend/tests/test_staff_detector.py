import cv2
import numpy as np
import pytest

from app.services.staff_detector import (
    cluster_coordinates,
    detect_staves_and_measures,
)


def create_synthetic_score_image(
    num_staves: int = 1,
    staves_per_system: int = 1,
    line_spacing: int = 10,
    width: int = 600,
    height: int = 400,
    draw_barlines: bool = True,
) -> np.ndarray:
    """
    Creates a clean synthetic sheet music image with black lines on white background (255).
    """
    img = np.full((height, width), 255, dtype=np.uint8)

    y_start = 50
    for s_idx in range(num_staves):
        # Draw 5 horizontal lines
        staff_lines = [y_start + i * line_spacing for i in range(5)]
        for y in staff_lines:
            cv2.line(img, (40, y), (width - 40, y), 0, 1)

        # Draw barlines if requested
        if draw_barlines:
            barline_xs = [40, 280, width - 40]
            top_y = staff_lines[0]
            bottom_y = staff_lines[4]
            # If grand staff, connect upper and lower staves
            if staves_per_system == 2 and s_idx % 2 == 1:
                prev_top_y = staff_lines[0] - 50 - 4 * line_spacing
                for bx in barline_xs:
                    cv2.line(img, (bx, prev_top_y), (bx, bottom_y), 0, 2)
            elif staves_per_system == 1:
                for bx in barline_xs:
                    cv2.line(img, (bx, top_y), (bx, bottom_y), 0, 2)

        # Increment y for next staff
        if staves_per_system == 2 and s_idx % 2 == 0:
            y_start += 4 * line_spacing + 50  # Gap between upper and lower staff in grand staff
        else:
            y_start += 4 * line_spacing + 100  # Gap between systems

    return img


def test_cluster_coordinates():
    raw = [10, 11, 12, 50, 51, 99]
    clustered = cluster_coordinates(raw, max_gap=2)
    assert len(clustered) == 3
    assert clustered[0] == 11
    assert clustered[1] == 50 or clustered[1] == 51
    assert clustered[2] == 99

    assert cluster_coordinates([]) == []


def test_detect_single_staff_system():
    img = create_synthetic_score_image(
        num_staves=1,
        staves_per_system=1,
        line_spacing=10,
        draw_barlines=True,
    )
    result = detect_staves_and_measures(img)

    assert result.staff_type == "single"
    assert len(result.systems) == 1
    system = result.systems[0]
    assert len(system.staves) == 1
    staff = system.staves[0]
    assert len(staff.lines) == 5
    assert pytest.approx(staff.line_spacing, abs=1.0) == 10.0
    assert len(system.measures) == 2
    assert system.measures[0].start_x == pytest.approx(40, abs=5)
    assert system.measures[0].end_x == pytest.approx(280, abs=5)


def test_detect_grand_staff_system():
    img = create_synthetic_score_image(
        num_staves=2,
        staves_per_system=2,
        line_spacing=10,
        draw_barlines=True,
    )
    result = detect_staves_and_measures(img)

    assert result.staff_type == "grand"
    assert len(result.systems) == 1
    system = result.systems[0]
    assert len(system.staves) == 2
    assert len(system.measures) >= 2


def test_detect_with_encoded_bytes():
    img = create_synthetic_score_image(num_staves=1, line_spacing=10)
    _, buf = cv2.imencode(".png", img)
    img_bytes = buf.tobytes()

    result = detect_staves_and_measures(img_bytes)
    assert len(result.systems) == 1
    assert len(result.systems[0].staves) == 1


def test_empty_image():
    blank = np.full((300, 300), 255, dtype=np.uint8)
    result = detect_staves_and_measures(blank)
    assert len(result.systems) == 0
    assert result.average_line_spacing == 10.0


def test_invalid_bytes():
    with pytest.raises(ValueError, match="No se pudo decodificar"):
        detect_staves_and_measures(b"not an image")
