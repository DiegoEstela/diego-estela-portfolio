# Flujo de desarrollo asistido por IA

Este repositorio usa Claude Code como parte del proceso de ingeniería, con GitHub como fuente de verdad. Todo está versionado en `.claude/` y `.github/`.

```mermaid
flowchart LR
  I[Issue en GitHub] --> P["/new-feature o /plan-issue"]
  P -->|plan como comentario| C{¿Plan OK?}
  C -- no --> P
  C -- sí --> M["/implement-issue"]
  M -->|"worktree + TDD, subagentes por área"| B[Rama con commits atómicos]
  B --> PR["PR draft · Closes #n"]
  PR --> CI["CI: lint, tipos, tests, build, commitlint, Lighthouse"]
  PR --> R[Revisión de Claude en el PR]
  CI --> G[Merge squash a main]
  R --> G
```

## Principios

1. **Humano en el bucle.** La IA planifica y propone; las acciones externas (push, PR, cierre de issues) las decide la persona.
2. **TDD estricto.** Red → green → refactor, un commit por tarea.
3. **Aislamiento.** Cada issue se implementa en un `git worktree`; las áreas independientes se reparten entre subagentes en paralelo y se integran con `merge --no-ff`.
4. **Calidad automatizada.** Husky + commitlint en local; CI y Lighthouse en el PR.
5. **Documentación viva.** context7 mantiene a la IA al día con las APIs de las librerías.
6. **Sin secretos en el repo.** Valores reales solo en `.claude/settings.local.json`, `.env` o *GitHub Secrets*.

## Piezas

| Pieza | Ubicación |
| ----- | --------- |
| Comando `/commit` | `.claude/commands/commit.md` |
| Skills | `.claude/skills/*/SKILL.md` |
| Agentes | `.claude/agents/*.md` |
| Permisos | `.claude/settings.json` |
| MCP | `.mcp.json` |
| CI/CD | `.github/workflows/` |
| Planes generados | `docs/plans/` |

## Puesta en marcha

1. `gh auth login` y `gh auth status`.
2. `npm ci` (activa Husky con `prepare`).
3. Secreto `ANTHROPIC_API_KEY` en GitHub para el workflow de Claude.
4. `bash scripts/seed-issues.sh` para crear etiquetas e issues iniciales.
