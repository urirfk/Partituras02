import cv2
import numpy as np

from app.services.image_preprocessor import (
    binarize_image,
    deskew_image,
    detect_skew_angle,
    ensure_grayscale,
    preprocess_image_bytes,
    preprocess_image_numpy,
)


def create_synthetic_score(
    width: int = 400,
    height: int = 200,
    angle: float = 0.0,
) -> np.ndarray:
    img = np.ones((height, width), dtype=np.uint8) * 255

    # Draw 5 horizontal staff lines
    for line_y in [60, 70, 80, 90, 100]:
        img[line_y : line_y + 2, 40 : width - 40] = 0

    if abs(angle) > 0.01:
        center = (width // 2, height // 2)
        rot_mat = cv2.getRotationMatrix2D(center, angle, 1.0)
        img = np.asarray(
            cv2.warpAffine(img, rot_mat, (width, height), borderValue=255),
            dtype=np.uint8,
        )

    return img


def test_ensure_grayscale():
    # 2D already grayscale
    g2d = np.zeros((50, 50), dtype=np.uint8)
    assert ensure_grayscale(g2d).shape == (50, 50)

    # 3D BGR
    bgr = np.zeros((50, 50, 3), dtype=np.uint8)
    assert ensure_grayscale(bgr).shape == (50, 50)

    # 4D BGRA
    bgra = np.zeros((50, 50, 4), dtype=np.uint8)
    assert ensure_grayscale(bgra).shape == (50, 50)


def test_binarize_image():
    h, w = 150, 300
    img = np.ones((h, w), dtype=np.uint8) * 255

    # Introduce uneven shadow gradient across the height
    for y in range(h):
        img[y, :] = int(255 - (y / h) * 90)

    # Add staff lines
    for line_y in [50, 60, 70, 80, 90]:
        img[line_y : line_y + 2, :] = 0

    binary = binarize_image(img, method="adaptive")
    unique_vals = set(np.unique(binary))

    # Must be pure black and white (only 0 and 255)
    assert unique_vals.issubset({0, 255})
    # Mean should be high (mostly white background)
    assert np.mean(binary) > 200
    # Lines should be preserved as black (0)
    assert np.mean(binary[70:72, :]) < 60


def test_detect_skew_angle_and_deskew():
    # Test horizontal score (angle 0)
    straight_score = create_synthetic_score(width=500, height=300, angle=0.0)
    angle_straight = detect_skew_angle(straight_score)
    assert abs(angle_straight) < 0.5

    # Test rotated score (angle 4.0 degrees)
    rotated_score = create_synthetic_score(width=500, height=300, angle=4.0)
    detected_angle = detect_skew_angle(rotated_score)
    # Rotation matrix was +4.0 counter-clockwise, Hough line detection should detect ~ -4.0
    assert abs(abs(detected_angle) - 4.0) < 0.6

    # Test deskew_image corrects alignment
    corrected, applied_angle = deskew_image(rotated_score)
    assert abs(abs(applied_angle) - 4.0) < 0.6
    new_angle = detect_skew_angle(corrected)
    assert abs(new_angle) < 0.5


def test_preprocess_image_bytes():
    score = create_synthetic_score(width=400, height=200, angle=3.0)
    _, encoded = cv2.imencode(".png", score)
    raw_bytes = bytes(encoded)

    processed_bytes, angle = preprocess_image_bytes(raw_bytes, do_deskew=True)
    assert len(processed_bytes) > 0
    assert abs(abs(angle) - 3.0) < 0.6

    # Decode processed bytes to verify valid PNG
    nparr = np.frombuffer(processed_bytes, np.uint8)
    decoded = cv2.imdecode(nparr, cv2.IMREAD_GRAYSCALE)
    assert decoded is not None
    assert set(np.unique(decoded)).issubset({0, 255})


def test_preprocess_image_numpy():
    score = create_synthetic_score(width=400, height=200, angle=2.5)
    binarized, angle = preprocess_image_numpy(score, do_deskew=True)
    assert binarized.shape == (200, 400)
    assert abs(abs(angle) - 2.5) < 0.6
    assert set(np.unique(binarized)).issubset({0, 255})

