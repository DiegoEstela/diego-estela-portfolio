---
name: plan-tdd
description: Planifica e implementa un cambio pequeño sin issue, con ciclos red-green-refactor en un worktree aislado. Úsala para mejoras rápidas que no justifican una issue.
argument-hint: "<descripción del cambio>"
---

# plan-tdd

Cambio sin issue: planificar e implementar con TDD en un worktree. Para trabajo con issue usa `/new-feature` + `/implement-issue`.

## Reglas

- Siempre en worktree; nunca modifiques el árbol principal.
- Sin push, PR ni acciones externas salvo petición expresa.
- Español para el plan y la comunicación; código, tests y commits en inglés.

## Pasos

1. Deduce un `<slug>` kebab-case de `$ARGUMENTS`.
2. Explora el código (Read/Grep/Glob) y escribe el plan en `docs/plans/<slug>.md` con tareas de 5-10 min, cada una con su test y ficheros. No inventes rutas ni símbolos.
3. Muestra el plan y espera confirmación (`AskUserQuestion`).
4. Crea el worktree: `git worktree add ../diego-estela-portfolio-wt-<slug> -b feature/<slug> main`, ejecuta `npm ci` y verifica `npm run lint && npm run test && npm run build` en verde.
5. Por tarea: **red → green → refactor**, commit en inglés (Conventional Commits), marca `[x]` en el plan.
6. Resumen final con el estado de la suite. Ofrece `git push -u origin feature/<slug>` y `gh pr create --draft`, sin ejecutarlos.

Para documentación actualizada de librerías (React, Vite, Tailwind, framer-motion) usa el MCP context7 si está disponible.
