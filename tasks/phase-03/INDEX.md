# FASE 3: Pipeline de Ingesta, Preprocesamiento de Imagen y Motor OMR
# Directorio: tasks/phase-03/ — Nivel 2 (Módulos de la Fase)

Esta fase implementa la ingesta de documentos musicales (PDFs mono y multipágina, imágenes PNG/JPG, MusicXML y MIDI), el preprocesamiento de visión por computador (OpenCV: binarización, deskewing y mejora de contraste), la extracción musical OMR y la conversión canónica al modelo de dominio `Score`.

---

## Módulos de Trabajo

- [x] **3.1: Ingestor y Parser de Archivos Estructurados (MusicXML y MIDI) hacia Modelo de Dominio** (-> `3.1-structured-ingestion.md`)
- [x] **3.2: Pipeline de Preprocesamiento de Imagen con OpenCV (Deskewing, Binarización Adaptativa y Normalización)** (-> `3.2-image-preprocessing.md`)
- [x] **3.3: Motor de Inferencia OMR y Mapeo a Estructura Musical Canónica** (-> `3.3-omr-engine.md`)
- [>] **3.4: Endpoints de Ingesta y Procesamiento FastAPI con Validación Multipágina** (-> `3.4-api-endpoints.md`)

---

## Registro de Transición de Fase
- **Fase 2:** Completada al 100% (Motor de renderizado SVG con solfeo, Gran Pentagrama y capas didácticas).
- **Fase 3:** Activada `[>]` en ROADMAP.md.
