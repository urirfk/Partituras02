# CONSTITUCIÓN OPERATIVA DEL AGENTE (AGENT.md)
# Proyecto: Partituras02 — Versión Estándar: 2.1.0

Este documento rige de forma estricta el comportamiento, protocolo de ejecución, navegación jerárquica y políticas de calidad del agente autónomo en este repositorio.

---

## 1. ESTÁNDAR VISUAL DE EJECUCIÓN (4 ESTADOS)
En todos los archivos de seguimiento (`ROADMAP.md`, `INDEX.md`, `tasks/**/*.md`), el estado de cualquier fase, módulo o micro-tarea se representa estrictamente con estas cuatro marcas:

- `- [ ]` : **Pendiente** (*To Do*) — En cola, esperando turno.
- `- [>]` : **En Curso** (*In Progress*) — Activa en este instante. Si una sesión se interrumpe, el agente retoma de inmediato este marcador.
- `- [x]` : **Completada** (*Done*) — Verificada por DoD, con tests en verde y commit atómico registrado.
- `- [!]` : **Bloqueada** (*Blocked*) — Freno de emergencia activado (*Circuit Breaker*) o consulta humana requerida.

---

## 2. PROTOCOLO DE NAVEGACIÓN POR CARGA PEREZOSA (LAZY LOADING)
Queda terminantemente prohibido leer todas las fases o tareas simultáneamente para evitar saturación de contexto. La navegación se realiza paso a paso:

1. **Paso 1:** Abre `ROADMAP.md` e identifica la Fase macro con marca `[>]` (o la primera `[ ]` disponible).
2. **Paso 2:** Abre el archivo de esa fase: `tasks/phase-XX/INDEX.md` e identifica el Módulo `X.Y` con marca `[>]` (o el primero `[ ]`).
3. **Paso 3:** Abre **únicamente** el archivo del módulo activo: `tasks/phase-XX/X.Y-<slug>.md`.
4. **Paso 4:** Localiza la micro-tarea `X.Y.Z` con marca `[>]` (o la primera `[ ]`), la marca como `[>]` y ejecuta **únicamente** esa micro-tarea.

---

## 3. CICLO DE EJECUCIÓN ATÓMICO (MICRO-TAREAS X.Y.Z)
Por cada micro-tarea `X.Y.Z`:
1. **Foco Estricto:** Modificar o crear únicamente los archivos asignados a esa micro-tarea.
2. **Validación Canónica:** Ejecutar la suite de comprobación antes de dar la tarea por buena:
   - Frontend: `npm run lint` && `npm run typecheck` && `npm test`
   - Backend: `ruff check` && `mypy` && `pytest`
3. **Pruebas de Invarianza:** Asegurar que ningún control ortogonal o estado previo ha sido acoplado o roto.
4. **Actualización de Estado:** Cambiar la marca a `- [x]` en el archivo del módulo `X.Y-<slug>.md`.
5. **Git Atómico:**
   - Queda terminantemente prohibido `git add .` o `git commit -a`.
   - Ejecutar `git add <archivo1> <archivo2> ...` exclusivamente con los archivos pertinentes.
   - Commit bajo *Conventional Commits*: `feat(...)`, `fix(...)`, `test(...)`, `chore(...)`.
   - `git push origin main` inmediato.

---

## 4. CIERRE Y TRANSICIÓN JUST-IN-TIME (JIT)
1. **Cierre de Módulo:** Cuando todas las micro-tareas de `X.Y-<slug>.md` estén en `- [x]`, se marca `- [x]` en `tasks/phase-XX/INDEX.md` y se activa el siguiente módulo `X.(Y+1)` marcándolo como `- [>]`.
2. **Cierre de Fase:** Cuando todos los módulos de `tasks/phase-XX/INDEX.md` estén en `- [x]`, se marca `- [x]` en `ROADMAP.md`, se crea la carpeta de la siguiente fase (`tasks/phase-(XX+1)/`) y se desglosa su `INDEX.md` y micro-tareas Just-in-Time.

---

## 5. DEFINITION OF DONE (DoD)
Una tarea o módulo jamás se considera terminado sin cumplir el 100% de estos criterios:
* **Tipado Estricto:** Cero errores de TypeScript / mypy.
* **Linter Limpio:** Cero advertencias o errores de linter.
* **Tests Automatizados:** 100% de los tests en verde.
* **Invarianza de UI y Controles:** Todo toggle o parámetro visual opera de forma ortogonal sin efectos colaterales en los demás.
* **i18n Estricto:** Cero cadenas visibles hardcodeadas; todo texto traducible proviene de los catálogos en `src/locales/`.

---

## 6. PROTOCOLO DE SEGURIDAD Y GIT
* Rama de trabajo canónica: `main`.
* Repositorio remoto: `https://github.com/urirfk/Partituras02.git`.
* Archivos confidenciales (`io.md`, credenciales, tokens) jamás deben añadirse a Git.

---

## 7. CIRCUIT BREAKER (FRENO DE EMERGENCIA)
Si tras **3 intentos consecutivos** una prueba falla o una implementación se bloquea:
1. Detener la ejecución inmediatamente.
2. Revertir el estado de trabajo sucio con `git restore .`.
3. Cambiar la marca de la tarea a `- [!]` (Bloqueada).
4. Informar al usuario con un diagnóstico técnico preciso y las opciones disponibles.

---

## 8. AUTONOMÍA DINÁMICA
* **Nivel 1 (Consultivo):** Cambios de arquitectura, contratos de dominio, stack o límites de alcance requieren validación explícita del usuario.
* **Nivel 2 (Adaptativo - SemVer Parche):** Ajustes de dependencias menores, refactorizaciones internas y micro-tareas técnicas se ejecutan autónomamente.
* **Nivel 3 (Ampliado - SemVer Menor):** Si surge una necesidad técnica estructural imprevista, el agente documenta la expansión en el Roadmap como `[AUTONOMOUS-EXPANSION]` y prosigue.
