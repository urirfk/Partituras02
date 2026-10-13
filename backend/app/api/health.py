from typing import Dict

from fastapi import APIRouter

router = APIRouter()


@router.get("/health", response_model=Dict[str, str])
def get_health() -> Dict[str, str]:
    """Health check endpoint to verify backend service status."""
    return {"status": "ok"}
