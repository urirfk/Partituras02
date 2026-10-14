# 🎼 Partituras02 — Edición Didáctica EZ-Play para Piano

> **Sistema web de limpieza, análisis y reformatizado didáctico de partituras para estudiantes y profesores de piano.**

Transforma partituras densas, apretadas o escaneadas en ediciones pedagógicas de alta legibilidad (*Pedagogical EZ-Play Scores*): cabezas de nota tipo cápsula con solfeo latino (`do`, `re`, `mi`...), baja densidad estricta (por defecto 2 compases por sistema), cifrado armónico superior, digitaciones claras, soporte táctil para atriles digitales y exportación vectorial 1:1 en papel A4.

---

## ✨ Características Principales

* **Cabezas de Nota Didácticas (Cápsulas de Solfeo):** Cápsulas negras redondeadas (`#18181b`) con texto blanco centrado (`do`, `re`, `mi`, `fa`, `sol`, `la`, `si`) y alteraciones visibles opcionales (`♭si`, `♯fa`).
* **Baja Densidad Estricta (Anti-Apelotonamiento):** Maquetación garantizada de compases por sistema (1, 2, 3 o 4; 2 por defecto) con espaciado proporcional anti-colisión.
* **Topología Dual:**
  * *Gran Pentagrama:* Piano a dos manos (Sol + Fa sincronizados, llave de sistema continua y barras de compás unificadas).
  * *Lead Sheet:* Pentagrama melódico único con acordes superiores y letra.
* **Pipeline de Ingesta Inteligente:** Acepta partituras en PDF (mono y multipágina), imágenes escaneadas (PNG/JPG), MusicXML y MIDI.
* **Preprocesamiento de Imagen y Motor OMR:** Binarización adaptativa Otsu, corrección de inclinación (*deskewing*), eliminación de ruido y detección de pentagramas y cabezas de nota.
* **Análisis Armónico Asistido (`music21`):** Detección automática de armonía tonal y cifrado superior (notación latina o americana).
* **Interfaz Split-Screen Zen:** Espacio de trabajo minimalista con divisor ajustable en tiempo real (Original vs. Didáctica limpia).
* **Editor Asistido y Popover Reactivo:** Clic en cualquier nota para alterar altura, alteración, octava, duración, silencio o digitación (1 a 5), con soporte de deshacer/rehacer ilimitado (`Ctrl+Z` / `Ctrl+Y`).
* **Controles Didácticos 100% Ortogonales:** Modificar cualquier interruptor (nombres de nota, alteraciones, acordes, digitaciones, letra, escala, compases por línea, transposición) opera sin efectos colaterales en los demás.
* **Modos de Salida Profesionales:**
  * Exportador vectorial A4 1:1 de alta fidelidad vía `jsPDF` y `svg2pdf.js` con orientación y márgenes configurables.
  * Exportación estructurada a formato MusicXML y archivos MIDI.
  * Archivo de sesión local simétrica (`.partitura` / JSON) para guardar y reanudar proyectos.
* **Modo Atril Inmersivo (*Music Stand Mode*):** Experiencia a pantalla completa sin distracciones, optimizada para tablets y atriles de piano con soporte para pedal Bluetooth (`PageDown`/`PageUp`), toques en pantalla táctil y atajo de teclado (`M` / `Esc`).
* **Tema Global y Accesibilidad:** Modos Claro y Oscuro con persistencia en `localStorage`, contraste didáctico WCAG AAA y navegación ARIA accesible con `focus trap`.
* **Internacionalización (i18n):** Soporte bilingüe completo en Español e Inglés sin cadenas hardcodeadas.

---

## 🛠️ Stack Tecnológico

| Capa | Tecnologías |
|---|---|
| **Frontend** | React 18+, TypeScript (estricto), Vite, Tailwind CSS, Lucide React, i18next |
| **Motor de Renderizado** | SVG Didáctico de alta precisión matemática |
| **Motor PDF** | jsPDF + svg2pdf.js (exportación vectorial 1:1) |
| **Backend** | Python 3.11+, FastAPI, OpenCV, NumPy, music21, Pillow, PyMuPDF |
| **Tooling & Calidad** | Vitest, Testing Library, Oxlint, Ruff, Mypy, Pytest |

---

## 🚀 Requisitos Previos

* **Node.js:** v18.0.0 o superior
* **npm:** v9.0.0 o superior
* **Python:** 3.11 o superior (recomendado 3.12)

---

## 📦 Instalación y Configuración

### 1. Clonar el Repositorio
```bash
git clone https://github.com/urirfk/Partituras02.git
cd Partituras02
```

### 2. Instalar Dependencias del Frontend
```bash
npm --prefix frontend install
```

### 3. Configurar Entorno Virtual del Backend
```bash
python3 -m venv backend/.venv
source backend/.venv/bin/activate
pip install -r backend/requirements.txt
```

---

## 🎯 Puesta en Marcha Rápida

Ejecuta el script unificado de arranque para iniciar el Backend y el Frontend simultáneamente:

```bash
./scripts/start.sh
```

Una vez levantado:
* **Aplicación Web:** [http://localhost:5173](http://localhost:5173)
* **Documentación API Swagger:** [http://localhost:8000/docs](http://localhost:8000/docs)

Para detener los servicios, presiona `Ctrl + C`.

---

## 🧪 Pipeline Canónico de Calidad y Validación

Partituras02 sigue un estándar estricto de calidad (*Definition of Done* al 100%). Para ejecutar todas las pruebas automatizadas (207 tests en verde), linters y comprobaciones de tipado estricto:

```bash
./scripts/validate.sh
```

El script ejecuta de forma secuencial:
1. `npm --prefix frontend run lint` (Oxlint)
2. `backend/.venv/bin/ruff check backend` (Ruff)
3. `npm --prefix frontend run typecheck` (TypeScript estricto)
4. `backend/.venv/bin/mypy backend/app backend/tests` (Mypy)
5. `npm --prefix frontend test` (34 suites Vitest / 161 tests)
6. `pytest backend/tests` (12 suites Pytest / 46 tests)

### Compilación para Producción (Build)
```bash
npm --prefix frontend run build
```
Genera los archivos optimizados en `frontend/dist/`.

---

## 🎹 Atajos de Teclado y Control de Atril

| Atajo | Acción |
|---|---|
| `Ctrl + Z` / `Cmd + Z` | Deshacer última edición |
| `Ctrl + Y` / `Ctrl + Shift + Z` | Rehacer edición |
| `M` | Entrar al Modo Atril (*Music Stand Mode*) |
| `Escape` | Salir del Modo Atril / Cerrar Modales y Popovers |
| `PageDown` / `Flecha Derecha` / `Espacio` | Avanzar compás/página en Modo Atril (Pedal Bluetooth) |
| `PageUp` / `Flecha Izquierda` | Retroceder compás/página en Modo Atril |

---

## 📄 Licencia

Este proyecto está licenciado bajo los términos de la Licencia MIT.
