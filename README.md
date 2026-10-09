# Portfolio de Diego Estela

[![CI](https://github.com/DiegoEstela/diego-estela-portfolio/actions/workflows/ci.yml/badge.svg)](https://github.com/DiegoEstela/diego-estela-portfolio/actions/workflows/ci.yml)
![React](https://img.shields.io/badge/React-19-61dafb?logo=react&logoColor=white)
![TypeScript](https://img.shields.io/badge/TypeScript-6-3178c6?logo=typescript&logoColor=white)
![Vite](https://img.shields.io/badge/Vite-8-646cff?logo=vite&logoColor=white)
![Tailwind](https://img.shields.io/badge/Tailwind-4-06b6d4?logo=tailwindcss&logoColor=white)

**Sitio en producción:** https://diego-estela-lopez.vercel.app

Portfolio personal de un desarrollador de software especializado en IA. Es también un **caso práctico de ingeniería asistida por IA**: el repositorio se desarrolla con un flujo de issues, planes, TDD, revisión y puntos de control humanos que está documentado y versionado aquí mismo.

## Qué incluye

- Secciones de perfil, proyectos, experiencia, educación, clientes, recomendaciones y contacto.
- Demos interactivas de proyectos (componentes propios con animaciones de `framer-motion`).
- Internacionalización **es/en** con i18next; un test garantiza que ambos idiomas tienen las mismas claves.
- Tema claro y oscuro.
- Chatbot sobre la API de Anthropic que responde preguntas sobre mi experiencia. La clave y el prompt viven en el servidor (`api/chat.ts`), con validación, límites de uso y una guardia en CI que impide que se filtren al bundle ([ADR 0004](docs/decisions/0004-api-del-chatbot-en-el-servidor.md)).

## Stack

| Capa | Tecnología |
| ---- | ---------- |
| UI | React 19, TypeScript 6, Tailwind CSS 4, framer-motion |
| Build | Vite 8 |
| i18n | i18next, react-i18next |
| Tests | Vitest, Testing Library, jsdom |
| Calidad | ESLint 9, Husky, lint-staged, commitlint |
| CI/CD | GitHub Actions, Lighthouse CI, Vercel (preview por PR) |
| IA | Claude Code (skills, agentes, hooks, MCP context7) |

## Cómo se trabaja en este repositorio

Cada cambio sigue el mismo ciclo, con una persona decidiendo en cada punto de control:

```
Issue → plan aprobado → TDD en un worktree → revisión previa → PR → CI + preview → prueba manual → merge
```

- **Plan antes de código:** `/new-feature` convierte una issue en un plan de tareas pequeñas, que se publica en la issue tras aprobación.
- **TDD estricto:** `/implement-issue` implementa con rojo, verde y refactor, un commit por tarea.
- **Defensa por capas:** hooks que bloquean acciones peligrosas (con tests), permisos, commitlint, CI y Lighthouse.
- **Humano en el bucle:** push, PR y merge los decide una persona; cada PR declara qué hizo la IA y qué verificó la persona.
- **Decisiones por escrito:** [`docs/decisions`](docs/decisions/README.md) y [`docs/plans`](docs/plans).

Detalle, diagrama y límites conocidos en **[docs/AI-WORKFLOW.md](docs/AI-WORKFLOW.md)**. Un ejemplo completo del ciclo es la [issue #11](https://github.com/DiegoEstela/diego-estela-portfolio/issues/11) y su [PR #17](https://github.com/DiegoEstela/diego-estela-portfolio/pull/17).

## Empezar

Requisitos: Node 22 o superior.

```bash
npm ci
npm run dev
```

| Comando | Para qué |
| ------- | -------- |
| `npm run dev` | Servidor de desarrollo |
| `npm run lint` | ESLint |
| `npm run typecheck` | Comprobación de tipos |
| `npm run test` | Tests (`test:watch`, `test:coverage`) |
| `npm run build` | Build de producción |
| `npm run check:bundle` | Falla si `dist/` contiene claves o el prompt del servidor |

Para probar el chatbot en local, crea `.env.local` con `ANTHROPIC_API_KEY` (ver `.env.example`). Solo la lee el servidor; `npm run dev` sirve `/api/chat` con el mismo handler que Vercel.

## Estructura

```
src/
  components/   Secciones y componentes de UI
  context/      Contextos de React (tema, chat)
  data/         Contenido del portfolio
  hooks/        Hooks propios
  locales/      Traducciones es y en
api/            Función serverless del chatbot (Vercel)
server/         Lógica del chatbot: validación, límites, adaptador
vite-plugins/   Plugin que sirve /api/chat en desarrollo
.claude/        Skills, agentes, hooks y permisos de Claude Code
.github/        Workflows, plantillas de issue y de PR, Dependabot
docs/           Flujo de IA, planes y decisiones (ADR)
```

## Seguridad del chatbot

- La clave de Anthropic y el prompt del sistema nunca llegan al navegador: el cliente solo habla con `/api/chat`.
- El servidor valida la entrada, limita el tamaño de la conversación y el ritmo de peticiones, y oculta los errores del proveedor.
- El CI falla si el bundle contiene una clave (`npm run check:bundle`).
- Límite honesto: el control de ritmo está en memoria por instancia, así que no es global; el tope real de gasto es el límite mensual de la consola de Anthropic.

## Contacto

Diego Estela · die.estela@gmail.com
