import io

import cv2
import numpy as np
import pypdfium2 as pdfium  # type: ignore[import-untyped]
from fastapi.testclient import TestClient

from app.main import app

client = TestClient(app)


def create_sample_score_image_bytes() -> bytes:
    img = np.full((300, 500), 255, dtype=np.uint8)
    # Draw 5 staff lines
    for y in [60, 72, 84, 96, 108]:
        cv2.line(img, (30, y), (470, y), 0, 1)
    # Draw barlines
    cv2.line(img, (30, 60), (30, 108), 0, 2)
    cv2.line(img, (250, 60), (250, 108), 0, 2)
    cv2.line(img, (470, 60), (470, 108), 0, 2)
    # Draw a notehead
    cv2.circle(img, (120, 108), 5, 0, -1)
    _, buf = cv2.imencode(".png", img)
    return bytes(buf)


def create_sample_pdf_bytes() -> bytes:
    pdf = pdfium.PdfDocument.new()
    pdf.new_page(width=500, height=300)
    buf = io.BytesIO()
    pdf.save(buf)
    return buf.getvalue()


def test_upload_image_endpoint():
    img_bytes = create_sample_score_image_bytes()
    files = {"file": ("score.png", io.BytesIO(img_bytes), "image/png")}
    response = client.post("/api/upload", files=files)
    assert response.status_code == 200
    data = response.json()
    assert data["filename"] == "score.png"
    assert data["is_pdf"] is False
    assert data["num_pages"] == 1
    assert data["size_bytes"] == len(img_bytes)


def test_upload_empty_file():
    files = {"file": ("empty.png", io.BytesIO(b""), "image/png")}
    response = client.post("/api/upload", files=files)
    assert response.status_code == 400


def test_process_omr_image_endpoint():
    img_bytes = create_sample_score_image_bytes()
    files = {"file": ("score.png", io.BytesIO(img_bytes), "image/png")}
    data = {
        "title": "Minuet",
        "composer": "Bach",
        "do_deskew": "true",
        "run_harmonics": "true",
    }
    response = client.post("/api/process-omr", files=files, data=data)
    assert response.status_code == 200
    score = response.json()
    assert score["metadata"]["title"] == "Minuet"
    assert score["metadata"]["composer"] == "Bach"
    assert len(score["measures"]) >= 1
    assert "pages" in score
    assert len(score["pages"]) == 1
    assert score["pages"][0].startswith("data:image/")


def test_process_omr_pdf_endpoint():
    pdf_bytes = create_sample_pdf_bytes()
    files = {"file": ("sheet.pdf", io.BytesIO(pdf_bytes), "application/pdf")}
    response = client.post("/api/process-omr", files=files)
    assert response.status_code == 200
    score = response.json()
    assert score["metadata"]["title"] == "sheet"
    assert len(score["measures"]) >= 1
    assert "pages" in score
    assert len(score["pages"]) == 1
    assert score["pages"][0].startswith("data:image/png;base64,")


def test_process_omr_empty_file():
    files = {"file": ("empty.pdf", io.BytesIO(b""), "application/pdf")}
    response = client.post("/api/process-omr", files=files)
    assert response.status_code == 400
