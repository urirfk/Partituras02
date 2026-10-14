import re

from fastapi import APIRouter, HTTPException, Response

from app.schemas.music import ScoreSchema
from app.services.export_service import export_to_midi, export_to_musicxml

router = APIRouter()


def _sanitize_filename(name: str, default: str = "partitura") -> str:
    cleaned = re.sub(r"[^a-zA-Z0-9_\-]", "_", (name or default).strip().lower())
    return cleaned or default


@router.post("/export-musicxml")
def export_musicxml_endpoint(score: ScoreSchema) -> Response:
    try:
        xml_content = export_to_musicxml(score)
        filename = _sanitize_filename(score.metadata.title) + ".musicxml"
        return Response(
            content=xml_content,
            media_type="application/vnd.recordare.musicxml+xml",
            headers={"Content-Disposition": f'attachment; filename="{filename}"'},
        )
    except Exception as exc:
        raise HTTPException(status_code=500, detail=f"Failed to export MusicXML: {exc}") from exc


@router.post("/export-midi")
def export_midi_endpoint(score: ScoreSchema) -> Response:
    try:
        midi_bytes = export_to_midi(score)
        filename = _sanitize_filename(score.metadata.title) + ".mid"
        return Response(
            content=midi_bytes,
            media_type="audio/midi",
            headers={"Content-Disposition": f'attachment; filename="{filename}"'},
        )
    except Exception as exc:
        raise HTTPException(status_code=500, detail=f"Failed to export MIDI: {exc}") from exc
