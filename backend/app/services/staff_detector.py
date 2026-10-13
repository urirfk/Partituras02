from dataclasses import dataclass
from typing import List, Union

import cv2
import numpy as np

from app.services.image_preprocessor import ensure_grayscale


@dataclass
class DetectedStaff:
    index: int
    top_y: int
    bottom_y: int
    line_spacing: float
    lines: List[int]


@dataclass
class DetectedMeasureBounds:
    measure_number: int
    start_x: int
    end_x: int
    width: int


@dataclass
class DetectedSystem:
    system_index: int
    top_y: int
    bottom_y: int
    staves: List[DetectedStaff]
    measures: List[DetectedMeasureBounds]


@dataclass
class StaffDetectionResult:
    systems: List[DetectedSystem]
    staff_type: str  # "single" | "grand"
    average_line_spacing: float


def cluster_coordinates(coords: List[int], max_gap: int = 3) -> List[int]:
    """
    Groups nearby pixel coordinates (e.g. from thick lines) into a single coordinate.
    """
    if not coords:
        return []
    sorted_coords = sorted(coords)
    clustered: List[int] = []
    current_cluster: List[int] = [sorted_coords[0]]

    for p in sorted_coords[1:]:
        if p - current_cluster[-1] <= max_gap:
            current_cluster.append(p)
        else:
            clustered.append(int(round(sum(current_cluster) / len(current_cluster))))
            current_cluster = [p]

    clustered.append(int(round(sum(current_cluster) / len(current_cluster))))
    return clustered


def detect_horizontal_staff_lines(inv_img: np.ndarray) -> List[DetectedStaff]:
    """
    Computes horizontal projection profile to identify sets of 5 parallel staff lines.
    """
    h, w = inv_img.shape[:2]
    # Threshold for a line to be considered a staff line (spanning at least 25% of width)
    min_line_width = w * 0.25

    hpp = np.sum(inv_img, axis=1) / 255.0
    raw_line_ys = [y for y in range(h) if hpp[y] >= min_line_width]
    clustered_ys = cluster_coordinates(raw_line_ys, max_gap=3)

    staves: List[DetectedStaff] = []
    # Group clustered lines into sets of 5
    for i in range(0, len(clustered_ys) - 4, 5):
        five_lines = clustered_ys[i : i + 5]
        spacings = [five_lines[j + 1] - five_lines[j] for j in range(4)]
        avg_spacing = float(np.mean(spacings))
        # Ensure spacing is consistent (standard musical stave has near-uniform spacing 6-25px)
        if 4.0 <= avg_spacing <= 35.0:
            staff_idx = len(staves)
            staves.append(
                DetectedStaff(
                    index=staff_idx,
                    top_y=five_lines[0],
                    bottom_y=five_lines[4],
                    line_spacing=avg_spacing,
                    lines=five_lines,
                )
            )

    return staves


def detect_system_barlines(
    inv_img: np.ndarray,
    top_y: int,
    bottom_y: int,
) -> List[int]:
    """
    Extracts the vertical slice covering the staff/system and locates barlines
    using morphological opening with a vertical structuring element.
    """
    h, w = inv_img.shape[:2]
    # Bound top_y and bottom_y safely
    y1 = max(0, top_y - 2)
    y2 = min(h, bottom_y + 2)
    height = y2 - y1

    if height < 10:
        return []

    v_slice = inv_img[y1:y2, :]
    # Vertical kernel spanning at least 50% of the staff height
    kernel_h = max(8, int(height * 0.5))
    kernel = cv2.getStructuringElement(cv2.MORPH_RECT, (1, kernel_h))
    vertical_features = cv2.morphologyEx(v_slice, cv2.MORPH_OPEN, kernel)

    vpp = np.sum(vertical_features, axis=0) / 255.0
    min_v_pixels = max(8.0, height * 0.4)
    raw_barline_xs = [x for x in range(w) if vpp[x] >= min_v_pixels]

    return cluster_coordinates(raw_barline_xs, max_gap=4)


def detect_staves_and_measures(
    image_input: Union[np.ndarray, bytes],
) -> StaffDetectionResult:
    """
    Full staff and measure layout detection:
    1. Inverts image to foreground.
    2. Detects all 5-line staves.
    3. Groups staves into systems (pairs for Grand Staff or singles for Lead Sheet).
    4. Detects intermediate and outer barlines to segment measures.
    """
    if isinstance(image_input, bytes):
        nparr = np.frombuffer(image_input, np.uint8)
        img = cv2.imdecode(nparr, cv2.IMREAD_GRAYSCALE)
        if img is None:
            raise ValueError("No se pudo decodificar la imagen.")
    else:
        img = ensure_grayscale(image_input)

    # Invert so black notation on white paper becomes white on black
    inv_img = 255 - img if np.mean(img) > 127 else img

    staves = detect_horizontal_staff_lines(inv_img)
    if not staves:
        return StaffDetectionResult(
            systems=[],
            staff_type="single",
            average_line_spacing=10.0,
        )

    avg_spacing = float(np.mean([s.line_spacing for s in staves]))

    # Determine if Grand Staff (consecutive pairs of staves separated by <= 3 * staff_height)
    is_grand_staff = False
    if len(staves) >= 2 and len(staves) % 2 == 0:
        gap = staves[1].top_y - staves[0].bottom_y
        staff_h = staves[0].bottom_y - staves[0].top_y
        if 0 < gap <= 2.5 * staff_h:
            is_grand_staff = True

    staff_type = "grand" if is_grand_staff else "single"
    staves_per_system = 2 if is_grand_staff else 1

    systems: List[DetectedSystem] = []
    measure_counter = 1

    for sys_idx, i in enumerate(range(0, len(staves), staves_per_system)):
        sys_staves = staves[i : i + staves_per_system]
        sys_top_y = sys_staves[0].top_y
        sys_bottom_y = sys_staves[-1].bottom_y

        barline_xs = detect_system_barlines(inv_img, sys_top_y, sys_bottom_y)

        measures: List[DetectedMeasureBounds] = []
        if len(barline_xs) >= 2:
            for b_idx in range(len(barline_xs) - 1):
                bx1 = barline_xs[b_idx]
                bx2 = barline_xs[b_idx + 1]
                w_meas = bx2 - bx1
                if w_meas > 20:  # Ignore double barline spacing
                    measures.append(
                        DetectedMeasureBounds(
                            measure_number=measure_counter,
                            start_x=bx1,
                            end_x=bx2,
                            width=w_meas,
                        )
                    )
                    measure_counter += 1

        systems.append(
            DetectedSystem(
                system_index=sys_idx,
                top_y=sys_top_y,
                bottom_y=sys_bottom_y,
                staves=sys_staves,
                measures=measures,
            )
        )

    return StaffDetectionResult(
        systems=systems,
        staff_type=staff_type,
        average_line_spacing=avg_spacing,
    )
