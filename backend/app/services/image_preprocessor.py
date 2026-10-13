from typing import Optional, Tuple

import cv2
import numpy as np


def ensure_grayscale(img: np.ndarray) -> np.ndarray:
    """
    Ensures that the input image is a single-channel 8-bit grayscale array.
    """
    if len(img.shape) == 2:
        return img
    if len(img.shape) == 3:
        if img.shape[2] == 4:
            # BGRA -> Gray
            return cv2.cvtColor(img, cv2.COLOR_BGRA2GRAY)
        if img.shape[2] == 3:
            # BGR -> Gray
            return cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
    return img


def binarize_image(
    gray: np.ndarray,
    method: str = "adaptive",
    block_size: int = 21,
    c: int = 10,
) -> np.ndarray:
    """
    Applies adaptive thresholding or Otsu binarization, guaranteeing
    pure black-and-white output (255 paper background, 0 black music ink).
    """
    gray = ensure_grayscale(gray)
    # Mild Gaussian blur to remove scanning grain
    blurred = cv2.GaussianBlur(gray, (3, 3), 0)

    if method == "otsu":
        _, binary = cv2.threshold(
            blurred, 0, 255, cv2.THRESH_BINARY + cv2.THRESH_OTSU
        )
    else:
        # Default adaptive Gaussian thresholding
        # block_size must be odd and >= 3
        if block_size % 2 == 0:
            block_size += 1
        binary = cv2.adaptiveThreshold(
            blurred,
            255,
            cv2.ADAPTIVE_THRESH_GAUSSIAN_C,
            cv2.THRESH_BINARY,
            block_size,
            c,
        )

    # Standardize polarity: music notation must have white paper (255) and black ink (0)
    if np.mean(binary) < 127:
        binary = cv2.bitwise_not(binary)

    return binary


def detect_skew_angle(binary_or_gray: np.ndarray) -> float:
    """
    Detects the dominant skew angle (in degrees) of music staff lines
    using edge detection and the Hough Line Transform.
    Returns angle in degrees, where 0.0 means perfectly horizontal.
    """
    gray = ensure_grayscale(binary_or_gray)
    # Invert so black staff lines become white foreground lines
    inv = 255 - gray if np.mean(gray) > 127 else gray

    edges = cv2.Canny(inv, 50, 150, apertureSize=3)
    lines = cv2.HoughLinesP(
        edges,
        rho=1,
        theta=np.pi / 180,
        threshold=70,
        minLineLength=50,
        maxLineGap=15,
    )

    if lines is None or len(lines) == 0:
        return 0.0

    angles = []
    for line_seg in lines:
        coords = line_seg.flatten()
        if len(coords) < 4:
            continue
        x1, y1, x2, y2 = coords[0], coords[1], coords[2], coords[3]
        angle = np.degrees(np.arctan2(y2 - y1, x2 - x1))
        # Musical staff lines are predominantly near-horizontal (±30 degrees)
        if abs(angle) < 30.0:
            angles.append(angle)

    if not angles:
        return 0.0

    median_angle = float(np.median(angles))
    # Threshold tiny micro-angles below 0.1 degree to prevent unnecessary resampling
    if abs(median_angle) < 0.1:
        return 0.0
    return median_angle


def deskew_image(
    img: np.ndarray,
    angle: Optional[float] = None,
) -> Tuple[np.ndarray, float]:
    """
    Rotates the image to align staff lines horizontally.
    If angle is not provided, it is automatically detected.
    """
    h, w = img.shape[:2]
    if angle is None:
        angle = detect_skew_angle(img)

    if abs(angle) < 0.1:
        return img, 0.0

    center = (w // 2, h // 2)
    # Rotate by the detected angle to make staff lines horizontal
    rot_mat = cv2.getRotationMatrix2D(center, angle, 1.0)
    # Fill border with white (255) to preserve music paper margins
    border_val = 255 if len(img.shape) == 2 else (255, 255, 255)
    deskewed = cv2.warpAffine(
        img,
        rot_mat,
        (w, h),
        flags=cv2.INTER_LINEAR,
        borderMode=cv2.BORDER_CONSTANT,
        borderValue=border_val,
    )

    return deskewed, angle


def preprocess_image_numpy(
    img: np.ndarray,
    do_deskew: bool = True,
    method: str = "adaptive",
) -> Tuple[np.ndarray, float]:
    """
    Full preprocessing pipeline on a numpy image:
    1. Grayscale conversion.
    2. Optional automatic deskewing.
    3. Adaptive binarization to clean 255/0 values.
    Returns (binarized_image, detected_skew_angle).
    """
    gray = ensure_grayscale(img)
    angle = 0.0
    if do_deskew:
        gray, angle = deskew_image(gray)

    binarized = binarize_image(gray, method=method)
    return binarized, angle


def preprocess_image_bytes(
    image_bytes: bytes,
    do_deskew: bool = True,
    method: str = "adaptive",
) -> Tuple[bytes, float]:
    """
    Decodes raw image bytes (PNG, JPG, TIFF, WebP), applies preprocessing pipeline,
    and returns encoded clean PNG bytes.
    """
    nparr = np.frombuffer(image_bytes, np.uint8)
    img = cv2.imdecode(nparr, cv2.IMREAD_UNCHANGED)
    if img is None:
        raise ValueError("No se pudo decodificar la imagen proporcionada.")

    binarized, angle = preprocess_image_numpy(
        img,
        do_deskew=do_deskew,
        method=method,
    )

    success, encoded_buf = cv2.imencode(".png", binarized)
    if not success:
        raise RuntimeError("Fallo al codificar la imagen procesada en formato PNG.")

    return bytes(encoded_buf), angle
