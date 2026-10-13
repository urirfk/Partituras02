from typing import List, Tuple

import cv2
import numpy as np
import pypdfium2 as pdfium  # type: ignore[import-untyped]

from app.services.image_preprocessor import preprocess_image_numpy


def convert_pdf_to_images(
    pdf_bytes: bytes,
    scale: float = 2.0,
    do_deskew: bool = True,
    method: str = "adaptive",
) -> List[Tuple[bytes, float]]:
    """
    Renders every page of a multi-page or single-page PDF document into high-resolution
    preprocessed PNG images ready for OMR processing.
    Returns a list of tuples: (png_bytes, detected_skew_angle).
    """
    try:
        pdf = pdfium.PdfDocument(pdf_bytes)
    except Exception as exc:
        raise ValueError(f"No se pudo decodificar el archivo PDF: {exc}") from exc

    processed_pages: List[Tuple[bytes, float]] = []

    for page in pdf:
        # Render high-resolution raster image
        pil_img = page.render(scale=scale).to_pil()
        np_img = np.array(pil_img)

        # Apply image preprocessing (grayscale, deskew, adaptive binarization)
        binarized_img, angle = preprocess_image_numpy(
            np_img,
            do_deskew=do_deskew,
            method=method,
        )

        success, encoded_buf = cv2.imencode(".png", binarized_img)
        if not success:
            raise RuntimeError("Fallo al codificar la página del PDF en formato PNG.")

        processed_pages.append((bytes(encoded_buf), angle))

    return processed_pages
