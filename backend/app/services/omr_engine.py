import uuid
from dataclasses import dataclass
from typing import List, Optional, Tuple, Union

import cv2
import music21
import numpy as np

from app.schemas.music import (
    KeySignatureSchema,
    MeasureSchema,
    NoteSchema,
    PitchSchema,
    ScoreMetadataSchema,
    ScoreSchema,
    StaffType,
    Step,
    TimeSignatureSchema,
)
from app.services.harmonic_analysis import analyze_score_harmonies
from app.services.image_preprocessor import preprocess_image_numpy
from app.services.music_domain_helpers import create_pitch_schema
from app.services.staff_detector import (
    DetectedMeasureBounds,
    DetectedStaff,
    detect_staves_and_measures,
)

# Diatonic steps table from C1 to B7
DIATONIC_SEQUENCE: List[Tuple[Step, int]] = []
for octv in range(1, 8):
    for stp in ["C", "D", "E", "F", "G", "A", "B"]:
        DIATONIC_SEQUENCE.append((stp, octv))  # type: ignore[arg-type]

TREBLE_BASE_INDEX = DIATONIC_SEQUENCE.index(("E", 4))  # Line 1 (bottom) of Treble clef
BASS_BASE_INDEX = DIATONIC_SEQUENCE.index(("G", 2))  # Line 1 (bottom) of Bass clef


@dataclass
class DetectedNotehead:
    cx: int
    cy: int
    radius: float


def get_pitch_from_y(
    cy: int,
    staff: DetectedStaff,
    clef: str = "treble",
) -> PitchSchema:
    """
    Computes musical pitch from vertical pixel position cy relative to staff lines.
    cy decreases going upwards, so higher notes have lower cy.
    """
    half_step = staff.line_spacing / 2.0
    if half_step <= 0:
        half_step = 5.0

    # Line 1 (bottom) is staff.bottom_y
    offset_steps = int(round((staff.bottom_y - cy) / half_step))

    base_idx = TREBLE_BASE_INDEX if clef == "treble" else BASS_BASE_INDEX
    target_idx = base_idx + offset_steps

    # Bound safely within diatonic range
    target_idx = max(0, min(len(DIATONIC_SEQUENCE) - 1, target_idx))
    step, octave = DIATONIC_SEQUENCE[target_idx]

    m21_pitch = music21.pitch.Pitch(f"{step}{octave}")
    return create_pitch_schema(m21_pitch)


def detect_noteheads_in_region(
    inv_img: np.ndarray,
    staff: DetectedStaff,
    bounds: DetectedMeasureBounds,
) -> List[DetectedNotehead]:
    """
    Detects elliptical/circular noteheads in a measure's staff region.
    Uses morphological operations and connected component filtering.
    """
    line_sp = staff.line_spacing
    margin_y = int(line_sp * 2.5)
    y1 = max(0, staff.top_y - margin_y)
    y2 = min(inv_img.shape[0], staff.bottom_y + margin_y)
    x1 = max(0, bounds.start_x)
    x2 = min(inv_img.shape[1], bounds.end_x)

    if y2 <= y1 or x2 <= x1:
        return []

    roi = inv_img[y1:y2, x1:x2]

    # Notehead kernel: morphological opening to eliminate thin staff lines and stems
    kw = max(3, int(line_sp * 0.75))
    kh = max(3, int(line_sp * 0.65))
    kernel = cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (kw, kh))
    opened = cv2.morphologyEx(roi, cv2.MORPH_OPEN, kernel)

    num_labels, labels, stats, centroids = cv2.connectedComponentsWithStats(opened)
    noteheads: List[DetectedNotehead] = []

    min_area = int((line_sp * 0.5) ** 2)
    max_area = int((line_sp * 2.5) ** 2)

    for i in range(1, num_labels):
        area = stats[i, cv2.CC_STAT_AREA]
        w = stats[i, cv2.CC_STAT_WIDTH]
        h = stats[i, cv2.CC_STAT_HEIGHT]

        if min_area <= area <= max_area and 0.4 <= (w / max(1, h)) <= 2.5:
            cx = int(round(centroids[i][0])) + x1
            cy = int(round(centroids[i][1])) + y1
            r = max(w, h) / 2.0
            noteheads.append(DetectedNotehead(cx=cx, cy=cy, radius=r))

    # Sort notes horizontally by cx
    noteheads.sort(key=lambda n: n.cx)
    return noteheads


def build_notes_for_staff(
    inv_img: np.ndarray,
    staff: DetectedStaff,
    bounds: DetectedMeasureBounds,
    clef: str,
    measure_number: int,
    prefix: str = "upper",
) -> List[NoteSchema]:
    """
    Extracts noteheads and converts them to NoteSchema list.
    If no noteheads are found, creates a default whole rest for the measure.
    """
    noteheads = detect_noteheads_in_region(inv_img, staff, bounds)
    notes: List[NoteSchema] = []

    if not noteheads:
        # Default whole rest for empty measure
        notes.append(
            NoteSchema(
                id=f"m{measure_number}-{prefix}-rest",
                is_rest=True,
                duration="whole",
                dots=0,
            )
        )
        return notes

    # Determine duration: if 1 note, whole; if 2, half; if 4, quarter...
    default_duration = "quarter"
    if len(noteheads) == 1:
        default_duration = "whole"
    elif len(noteheads) == 2:
        default_duration = "half"
    elif len(noteheads) >= 5:
        default_duration = "eighth"

    for idx, nh in enumerate(noteheads):
        pitch_schema = get_pitch_from_y(nh.cy, staff, clef=clef)
        notes.append(
            NoteSchema(
                id=f"m{measure_number}-{prefix}-n{idx + 1}",
                pitch=pitch_schema,
                is_rest=False,
                duration=default_duration,  # type: ignore[arg-type]
                dots=0,
            )
        )

    return notes


def process_omr_image(
    image_input: Union[np.ndarray, bytes],
    title: str = "Partitura OMR",
    composer: str = "Desconocido",
    do_deskew: bool = True,
    run_harmonics: bool = True,
) -> ScoreSchema:
    """
    Full OMR Recognition Pipeline:
    1. Preprocesses image (binarization, deskewing).
    2. Detects staves, systems, and barlines.
    3. Segments measures and extracts notes for single or grand staff.
    4. Enriches with Latin solfège badges.
    5. Injects harmonic analysis chords.
    """
    if isinstance(image_input, bytes):
        nparr = np.frombuffer(image_input, np.uint8)
        img = cv2.imdecode(nparr, cv2.IMREAD_UNCHANGED)
        if img is None:
            raise ValueError("No se pudo decodificar la imagen OMR.")
    else:
        img = image_input

    # Step 1: Preprocess image
    binarized, _ = preprocess_image_numpy(img, do_deskew=do_deskew)
    inv_img = 255 - binarized if np.mean(binarized) > 127 else binarized

    # Step 2: Staff & measure layout detection
    detection_result = detect_staves_and_measures(binarized)
    staff_type: StaffType = "grand" if detection_result.staff_type == "grand" else "single"

    measures: List[MeasureSchema] = []
    measure_counter = 1

    time_sig = TimeSignatureSchema(beats=4, beat_type=4)
    key_sig = KeySignatureSchema(fifths=0, mode="major", name="Do Mayor")

    # Step 3: Extract notes across detected systems and measures
    for system in detection_result.systems:
        is_grand = len(system.staves) >= 2
        upper_staff = system.staves[0]
        lower_staff = system.staves[1] if is_grand else None

        for m_bounds in system.measures:
            m_num = measure_counter
            measure_counter += 1

            upper_notes = build_notes_for_staff(
                inv_img=inv_img,
                staff=upper_staff,
                bounds=m_bounds,
                clef="treble",
                measure_number=m_num,
                prefix="rh" if is_grand else "m",
            )

            lower_notes: Optional[List[NoteSchema]] = None
            if is_grand and lower_staff is not None:
                lower_notes = build_notes_for_staff(
                    inv_img=inv_img,
                    staff=lower_staff,
                    bounds=m_bounds,
                    clef="bass",
                    measure_number=m_num,
                    prefix="lh",
                )

            meas_schema = MeasureSchema(
                number=m_num,
                time_signature=time_sig if m_num == 1 else None,
                key_signature=key_sig if m_num == 1 else None,
                notes=upper_notes,
                lower_notes=lower_notes,
                chords=[],
            )
            measures.append(meas_schema)

    # Fallback if no measures were detected
    if not measures:
        measures.append(
            MeasureSchema(
                number=1,
                time_signature=time_sig,
                key_signature=key_sig,
                notes=[NoteSchema(id="m1-rest", is_rest=True, duration="whole", dots=0)],
                lower_notes=(
                    [NoteSchema(id="m1-lh-rest", is_rest=True, duration="whole", dots=0)]
                    if staff_type == "grand"
                    else None
                ),
            )
        )

    score_id = f"omr-{uuid.uuid4().hex[:8]}"
    score = ScoreSchema(
        id=score_id,
        metadata=ScoreMetadataSchema(
            title=title,
            composer=composer,
        ),
        staff_type=staff_type,
        measures=measures,
    )

    # Step 4: Assisted harmonic analysis
    if run_harmonics:
        score = analyze_score_harmonies(score)

    return score


def process_omr_pages(
    pages: List[Union[np.ndarray, bytes]],
    title: str = "Partitura OMR Multipágina",
    composer: str = "Desconocido",
) -> ScoreSchema:
    """
    Processes multiple rasterized pages of a sheet music score,
    concatenating measures sequentially with continuous measure numbering.
    """
    if not pages:
        raise ValueError("No se proporcionaron páginas para procesar.")

    all_measures: List[MeasureSchema] = []
    detected_staff_type: StaffType = "single"
    current_meas_num = 1

    for page_idx, page in enumerate(pages):
        page_score = process_omr_image(
            page,
            title=title,
            composer=composer,
            run_harmonics=False,
        )
        if page_idx == 0:
            detected_staff_type = page_score.staff_type

        for m in page_score.measures:
            renumbered = m.model_copy(update={"number": current_meas_num})
            all_measures.append(renumbered)
            current_meas_num += 1

    combined_score = ScoreSchema(
        id=f"omr-multi-{uuid.uuid4().hex[:8]}",
        metadata=ScoreMetadataSchema(title=title, composer=composer),
        staff_type=detected_staff_type,
        measures=all_measures,
    )

    return analyze_score_harmonies(combined_score)
