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
- Chatbot sobre la API de Anthropic que responde preguntas sobre mi experiencia.

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

El chatbot necesita una clave de Anthropic en `.env` (ver `.env.example`).

## Estructura

```
src/
  components/   Secciones y componentes de UI
  context/      Contextos de React (tema, chat)
  data/         Contenido del portfolio
  hooks/        Hooks propios
  locales/      Traducciones es y en
.claude/        Skills, agentes, hooks y permisos de Claude Code
.github/        Workflows, plantillas de issue y de PR, Dependabot
docs/           Flujo de IA, planes y decisiones (ADR)
```

## Limitaciones conocidas

- El chatbot llama a la API de Anthropic desde el navegador, por lo que la clave `VITE_*` queda expuesta en el bundle. Está identificado y planificado: [issue #10](https://github.com/DiegoEstela/diego-estela-portfolio/issues/10) (mover la llamada a una función serverless con límites de uso).

## Contacto

Diego Estela · die.estela@gmail.com
