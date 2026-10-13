# ROADMAP MACRO DEL PROYECTO (ROADMAP.md)
# Proyecto: Partituras02 — Nivel 1 (Visión Estratégica)
# Versión: v1.0.0

---

## 1. RESUMEN DEL PRODUCTO
Sistema de limpieza y reformatizado didáctico de partituras para piano y teclado (*Pedagogical EZ-Play Scores*). Transforma partituras densas, apretadas o escaneadas en documentos con espaciado holgado, cabezas de nota tipo cápsula con solfeo latino (`do`, `re`, `mi`...), baja densidad estricta (2 compases por sistema), cifrado armónico superior y digitaciones claras, optimizado para atril digital táctil e impresión en papel A4.

* **Frontend:** React 18+ (TypeScript estricto) + Vite + Tailwind CSS + VexFlow / Verovio (SVG WebAssembly).
* **PDF Engine:** jsPDF + svg2pdf.js (exportación vectorial A4 1:1).
* **Backend:** Python 3.11+ con FastAPI + OpenCV (deskewing/binarización) + `music21` (análisis armónico y MusicXML) + Pipeline OMR.
* **Repositorio:** `https://github.com/urirfk/Partituras02.git` (Rama: `main`).

---

## 2. LÍMITES DEL PROYECTO (SCOPE BOUNDARIES)

### In-Scope (Núcleo del Sistema)
- Ingesta de PDFs (mono y multipágina), imágenes (PNG/JPG) y archivos estructurados (MusicXML y MIDI).
- Preprocesamiento de imagen: binarización, corrección de inclinación (*deskewing*) y contraste.
- Pipeline OMR de extracción musical hacia modelo estándar MusicXML.
- Motor de renderizado didáctico SVG con cápsulas de solfeo latino (`do`, `re`...) y alteraciones visibles opcionales.
- Soporte topológico dual: Lead Sheet (1 pentagrama + acordes + letra) y Gran Pentagrama (2 pentagramas Sol/Fa sincronizados).
- Análisis armónico asistido (detección de acordes para 2 pentagramas vía `music21`).
- Interfaz Split-Screen con separador ajustable (Original vs Limpio) y filosofía de diseño Zen minimalista.
- Popover de edición y corrección rápida por clic en nota (altura, alteraciones, digitación 1-5).
- Controles ortogonales independientes (nombres de nota, alteraciones, acordes, digitaciones, letra, escala, densidad, transposición).
- Exportación a PDF vectorial A4 (vertical/horizontal, márgenes, cabeceras editoriales y números de compás), SVG, PNG, MusicXML, MIDI y archivo de sesión local (`.partitura` / JSON).
- Modo Atril a pantalla completa sin distracciones con navegación táctil, teclado o pedal Bluetooth.
- Internacionalización completa (i18n) con soporte Español e Inglés sin cadenas hardcodeadas.

### Out-of-Scope (Excluido deliberadamente)
- Cuentas de usuario, autenticación obligatoria y base de datos cloud (opera como utilitario local sin login).
- Partituras orquestales o ensambles polifónicos de más de 2 pentagramas simultáneos.
- Reconocimiento de manuscritos o partituras dibujadas a mano alzada.
- Edición DAW o secuenciación de audio compleja.
- Tablaturas de guitarra o notación gráfica experimental.

---

## 3. CONTRATOS E INVARIANTES DE DOMINIO
1. **Invariante de Sincronía y Fidelidad Musical:** El re-espaciado o la inyección de cápsulas jamás puede alterar el pulso, las duraciones rítmicas ni la alineación vertical de ambas manos en el Gran Pentagrama.
2. **Regla de Independencia de Controles (Invarianza de UI):** Cada interruptor visual (nombres en notas, alteraciones en cápsulas, acordes, digitación, letra, escala, densidad, transposición) es 100% ortogonal e independiente. Modificar un control jamás debe alterar ni reiniciar el estado de los demás.
3. **Invariante de Densidad Estricta:** Si el selector fija N compases por sistema (por defecto 2), el motor maquetará exactamente N compases por línea sin desbordamiento involuntario.
4. **Comandos Canónicos de Validación Local:**
   - Frontend: `npm run lint` && `npm run typecheck` && `npm test`
   - Backend: `ruff check` && `mypy` && `pytest`

---

## 4. FASES MACRO DEL PROYECTO (NIVEL 1)

- [x] **Fase 1: Arquitectura Base, Setup y Tooling** (Completada -> `tasks/phase-01/`)
- [x] **Fase 2: Motor de Renderizado Didáctico SVG** (Completada -> `tasks/phase-02/`)
- [>] **Fase 3: Pipeline de Ingesta, Preprocesamiento de Imagen y Motor OMR** (EN CURSO -> `tasks/phase-03/`)
- [ ] **Fase 4: Interfaz Split-Screen Zen, Editor Asistido y Controles Ortogonales** (Pendiente)
- [ ] **Fase 5: Modos de Salida (Exportador PDF A4 Vectorial, MusicXML/MIDI, Proyecto Local y Modo Atril)** (Pendiente)
- [ ] **Fase 6: Pruebas Integradas End-to-End, Refinamiento Visual y Despliegue** (Pendiente)

---

## 5. HISTORIAL DE VERSIONES (SemVer)
- **v1.0.0 (2026-10-13):** Emisión inicial de arquitectura consensuada, contratos de calidad y roadmap macro de 6 fases tras debate técnico formal (`ini01.md`).
