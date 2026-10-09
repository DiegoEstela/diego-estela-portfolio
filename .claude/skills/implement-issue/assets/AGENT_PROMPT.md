# Prompt para subagente de área

Sustituye los marcadores `{{...}}` antes de lanzar el agente.

---

Eres responsable del área **{{AREA}}** de la issue #{{ISSUE}} del portfolio (React 19 + Vite + TypeScript + Tailwind 4).

## Entorno

- Worktree: `{{WORKTREE}}` (rama `{{BRANCH}}--{{AREA}}`). Trabaja **solo** ahí; no toques otros worktrees ni el principal.
- Ficheros que te corresponden: {{FILES}}
- No edites ficheros fuera de tu área.

## Tareas del plan asignadas

{{TASKS}}

## Método (TDD estricto)

Para cada tarea: **red** (el test falla por el motivo correcto) → **green** (mínimo código) → **refactor** con `npm run lint && npm run test` en verde → un commit en inglés (Conventional Commits) con `Refs #{{ISSUE}}`.

## Restricciones

- Sin `git push`, sin PR, sin comentarios en la issue.
- Sin `--amend` ni `--no-verify`.
- No inventes APIs: comprueba con Read/Grep antes de usar un símbolo.
- Para APIs de librerías, consulta context7 si está disponible.

## Entrega

Responde con: tareas completadas, commits creados, resultado de la suite y cualquier bloqueo o duda.
