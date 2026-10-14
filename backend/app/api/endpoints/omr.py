import base64
import uuid
from typing import Optional

from fastapi import APIRouter, File, Form, HTTPException, UploadFile, status
from pydantic import BaseModel

from app.schemas.music import ScoreSchema
from app.services.omr_engine import process_omr_image, process_omr_pages
from app.services.pdf_converter import convert_pdf_to_images

router = APIRouter()


class UploadResponseSchema(BaseModel):
    file_id: str
    filename: str
    content_type: str
    is_pdf: bool
    num_pages: int
    size_bytes: int


@router.post(
    "/upload",
    response_model=UploadResponseSchema,
    status_code=status.HTTP_200_OK,
    summary="Valida y analiza un documento musical (PDF o imagen)",
)
async def upload_document(file: UploadFile = File(...)) -> UploadResponseSchema:
    if not file.filename:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Se requiere un archivo con nombre válido.",
        )

    content = await file.read()
    if not content:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="El archivo proporcionado está vacío.",
        )

    file_id = str(uuid.uuid4())
    filename_lower = file.filename.lower()
    is_pdf = filename_lower.endswith(".pdf") or file.content_type == "application/pdf"

    num_pages = 1
    if is_pdf:
        try:
            converted = convert_pdf_to_images(content)
            num_pages = len(converted)
        except Exception as exc:
            raise HTTPException(
                status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
                detail=f"Error al analizar el archivo PDF: {exc}",
            ) from exc

    return UploadResponseSchema(
        file_id=file_id,
        filename=file.filename,
        content_type=file.content_type or "application/octet-stream",
        is_pdf=is_pdf,
        num_pages=num_pages,
        size_bytes=len(content),
    )


@router.post(
    "/process-omr",
    response_model=ScoreSchema,
    status_code=status.HTTP_200_OK,
    summary="Procesa una imagen o PDF y genera la partitura didáctica ScoreSchema",
)
async def process_omr(
    file: UploadFile = File(...),
    title: Optional[str] = Form(None),
    composer: Optional[str] = Form(None),
    do_deskew: bool = Form(True),
    run_harmonics: bool = Form(True),
) -> ScoreSchema:
    if not file.filename:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Se requiere un archivo con nombre válido.",
        )

    content = await file.read()
    if not content:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="El archivo proporcionado está vacío.",
        )

    effective_title = title or file.filename.rsplit(".", 1)[0]
    effective_composer = composer or "Desconocido"

    filename_lower = file.filename.lower()
    is_pdf = filename_lower.endswith(".pdf") or file.content_type == "application/pdf"

    try:
        if is_pdf:
            rendered_pages = convert_pdf_to_images(
                content,
                do_deskew=do_deskew,
            )
            page_bytes_list = [p[0] for p in rendered_pages]
            score = process_omr_pages(
                page_bytes_list,
                title=effective_title,
                composer=effective_composer,
            )
            score.pages = [
                f"data:image/png;base64,{base64.b64encode(p[0]).decode('ascii')}"
                for p in rendered_pages
            ]
        else:
            score = process_omr_image(
                content,
                title=effective_title,
                composer=effective_composer,
                do_deskew=do_deskew,
                run_harmonics=run_harmonics,
            )
            content_type = file.content_type or "image/png"
            if not content_type.startswith("image/"):
                content_type = "image/png"
            score.pages = [
                f"data:{content_type};base64,{base64.b64encode(content).decode('ascii')}"
            ]
        return score
    except Exception as exc:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail=f"Error durante el procesamiento OMR: {exc}",
        ) from exc
