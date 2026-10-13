from fastapi import APIRouter, File, Form, HTTPException, Query, UploadFile, status

from app.schemas.music import ScoreSchema
from app.services.harmonic_analysis import analyze_score_harmonies
from app.services.midi_parser import parse_midi_bytes
from app.services.musicxml_parser import parse_musicxml_content

router = APIRouter()


@router.post(
    "/import-musicxml",
    response_model=ScoreSchema,
    status_code=status.HTTP_200_OK,
    summary="Importa y parsea una partitura MusicXML (.xml, .musicxml, .mxl)",
)
async def import_musicxml(file: UploadFile = File(...)) -> ScoreSchema:
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

    try:
        score = parse_musicxml_content(content)
        return score
    except Exception as exc:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail=f"Error al procesar el archivo MusicXML: {exc}",
        ) from exc


@router.post(
    "/import-midi",
    response_model=ScoreSchema,
    status_code=status.HTTP_200_OK,
    summary="Importa y cuantiza un archivo MIDI estándar (.mid, .midi)",
)
async def import_midi(
    file: UploadFile = File(...),
    split_by_pitch: bool = Form(False),
) -> ScoreSchema:
    if not file.filename:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Se requiere un archivo con nombre válido.",
        )

    midi_bytes = await file.read()
    if not midi_bytes:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="El archivo MIDI proporcionado está vacío.",
        )

    try:
        score = parse_midi_bytes(
            midi_bytes,
            title=file.filename.rsplit(".", 1)[0],
            split_by_pitch=split_by_pitch,
        )
        return score
    except Exception as exc:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail=f"Error al procesar el archivo MIDI: {exc}",
        ) from exc


@router.post(
    "/analyze-harmony",
    response_model=ScoreSchema,
    status_code=status.HTTP_200_OK,
    summary="Ejecuta análisis armónico asistido sobre el modelo Score",
)
def analyze_harmony(
    score: ScoreSchema,
    override: bool = Query(False),
) -> ScoreSchema:
    try:
        updated_score = analyze_score_harmonies(score, override_existing=override)
        return updated_score
    except Exception as exc:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail=f"Error al analizar la armonía: {exc}",
        ) from exc
