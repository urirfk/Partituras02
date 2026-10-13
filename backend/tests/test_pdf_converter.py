import io

import cv2
import numpy as np
import pypdf
import pytest

from app.services.pdf_converter import convert_pdf_to_images


def create_in_memory_pdf(num_pages: int = 1) -> bytes:
    writer = pypdf.PdfWriter()
    for _ in range(num_pages):
        writer.add_blank_page(width=300, height=400)
    buf = io.BytesIO()
    writer.write(buf)
    return buf.getvalue()


def test_convert_single_page_pdf():
    pdf_bytes = create_in_memory_pdf(num_pages=1)
    pages = convert_pdf_to_images(pdf_bytes, scale=1.0)

    assert len(pages) == 1
    page_bytes, angle = pages[0]
    assert len(page_bytes) > 0
    assert abs(angle) < 0.5

    # Check that returned bytes decode to an actual image
    nparr = np.frombuffer(page_bytes, np.uint8)
    img = cv2.imdecode(nparr, cv2.IMREAD_GRAYSCALE)
    assert img is not None
    assert img.shape == (400, 300)


def test_convert_multipage_pdf():
    pdf_bytes = create_in_memory_pdf(num_pages=3)
    pages = convert_pdf_to_images(pdf_bytes, scale=1.0)

    assert len(pages) == 3
    for page_bytes, angle in pages:
        assert len(page_bytes) > 0
        nparr = np.frombuffer(page_bytes, np.uint8)
        img = cv2.imdecode(nparr, cv2.IMREAD_GRAYSCALE)
        assert img is not None


def test_convert_invalid_pdf_raises_error():
    with pytest.raises(ValueError, match="No se pudo decodificar el archivo PDF"):
        convert_pdf_to_images(b"not a valid pdf content")
