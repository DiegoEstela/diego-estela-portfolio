# Portfolio de Diego Estela

SPA personal (React 19 + Vite 8 + TypeScript + Tailwind 4) con chatbot basado en la API de Anthropic. Se despliega en Vercel.

**Idioma:** documentación, planes, skills y mensajes al usuario en **español**. Código, tests y commits en **inglés**.

## Comandos

| Tarea | Comando |
| ----- | ------- |
| Desarrollo | `npm run dev` |
| Lint | `npm run lint` |
| Tipos | `npm run typecheck` |
| Tests | `npm run test` (`test:watch`, `test:coverage`) |
| Build | `npm run build` |

Antes de dar algo por terminado: `npm run lint && npm run typecheck && npm run test && npm run build`.

## Estructura y áreas

| Área | Rutas | Etiqueta |
| ---- | ----- | -------- |
| `web` | `src/components`, `src/hooks`, `src/context`, `src/styles` | `proyecto:web` |
| `content` | `src/data/portfolio.ts`, `src/locales/{es,en}.json`, `public/` | `proyecto:content` |
| `chatbot` | `src/components/Chatbot`, futura `api/` | `proyecto:chatbot` |
| `infra` | `.github`, `.claude`, configuración de build y CI | `proyecto:infra` |

Alias `@` → `src`. Los textos visibles pasan por i18next y **toda clave debe existir en es y en** (lo comprueba `src/locales/locales.test.ts`).

## Flujo de trabajo con IA

Issue → plan → implementación TDD → PR. Detalle y diagrama en [docs/AI-WORKFLOW.md](docs/AI-WORKFLOW.md).

| Herramienta | Uso |
| ----------- | --- |
| `/commit` | Commit con Conventional Commits, nunca hace push |
| `/new-feature <n>` | Lee la issue, crea la rama, escribe y publica el plan |
| `/plan-issue <n>` | Solo planifica y publica el plan (no toca código) |
| `/implement-issue <n>` | Implementa el plan con TDD en un worktree, con subagentes por área |
| `/plan-tdd <desc>` | Cambio pequeño sin issue, con TDD en worktree |

Agentes en `.claude/agents/`: `code-reviewer`, `content-copywriter`, `web-quality-auditor`, `security-auditor`.

MCP (`.mcp.json`): **context7** para documentación actualizada de React, Vite, Tailwind, etc. Úsalo antes de recurrir a memoria al tocar APIs de librerías.

## Reglas

- Ramas: `<tipo>/<n>-<descripcion-kebab>` desde `main`. PR con squash merge.
- Commits: Conventional Commits en inglés, validados por commitlint (Husky). Sin `--no-verify` ni `--amend`.
- Nunca `git add -A`/`git add .`. Nunca commitear `.env*` ni secretos.
- Nada de acciones externas (push, PR, comentarios, cerrar issues) sin petición expresa; la excepción es publicar el plan en `new-feature` y `plan-issue`.
- Con worktree activo, no se modifica el árbol principal. Los worktrees viven en `.claude/worktrees/` (ignorado).
- Todo `VITE_*` acaba en el bundle público: **nunca** poner claves privadas ahí.

## Secretos

`.claude/settings.local.json` y `.env*` no se versionan. `.env.example` documenta las variables. `ANTHROPIC_API_KEY` para GitHub Actions va en *Settings → Secrets*.
