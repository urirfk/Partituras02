from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api.endpoints.export import router as export_router
from app.api.endpoints.ingestion import router as ingestion_router
from app.api.endpoints.omr import router as omr_router
from app.api.health import router as health_router

app = FastAPI(
    title="Partituras02 Backend API",
    description="Motor de preprocesamiento, análisis armónico y pipeline OMR para partituras",
    version="0.1.0",
)

# CORS middleware for local frontend development
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(health_router, tags=["Health"])
app.include_router(ingestion_router, prefix="/api", tags=["Ingestion"])
app.include_router(omr_router, prefix="/api", tags=["OMR"])
app.include_router(export_router, prefix="/api", tags=["Export"])


if __name__ == "__main__":
    import uvicorn

    uvicorn.run("app.main:app", host="0.0.0.0", port=8000, reload=True)
