#!/usr/bin/env bash
# ==============================================================================
# Partituras02 — Script de Arranque Local Unificado
# ==============================================================================
set -e

PROJECT_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$PROJECT_ROOT"

echo "======================================================================"
echo "  🎼 Partituras02 — Edición Didáctica EZ-Play para Piano"
echo "======================================================================"

# Cleanup background processes on exit
cleanup() {
  echo ""
  echo "Deteniendo servidores..."
  kill $(jobs -p) 2>/dev/null || true
  exit 0
}
trap cleanup EXIT INT TERM

# 1. Iniciar Backend FastAPI
echo "[1/2] Iniciando Backend FastAPI (Python / music21 / OpenCV)..."
if [ ! -d "backend/.venv" ]; then
  echo "Error: No se encontró el entorno virtual 'backend/.venv'."
  echo "Por favor, ejecute: python3 -m venv backend/.venv && backend/.venv/bin/pip install -r backend/requirements.txt"
  exit 1
fi

PYTHONPATH=backend backend/.venv/bin/uvicorn app.main:app --host 0.0.0.0 --port 8000 &
BACKEND_PID=$!

# 2. Iniciar Frontend Vite
echo "[2/2] Iniciando Frontend React (Vite / Tailwind)..."
npm --prefix frontend run dev &
FRONTEND_PID=$!

echo ""
echo "======================================================================"
echo "  🚀 Servicios activos y listos para usar:"
echo "     • Interfaz Web: http://localhost:5173"
echo "     • Documentación API: http://localhost:8000/docs"
echo "     • Presiona Ctrl+C para detener ambos servicios."
echo "======================================================================"
echo ""

# Wait for both processes
wait
