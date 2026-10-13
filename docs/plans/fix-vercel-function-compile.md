# Plan: Avisos de compilación de funciones en Vercel

- **Rama:** `fix/vercel-function-compile` (sin issue)
- **Área:** chatbot
- **Tipo:** fix

## Contexto

El build de Vercel termina bien, pero al compilar las funciones muestra dos errores de TypeScript que no aparecen en local (`tsc -b` está limpio):

1. `server/chat/handleChat.ts(81)`: `Property 'value' does not exist on type '{ tooLarge: true; }'`. El `if (body.tooLarge)` solo estrecha el tipo con `strict`, y Vercel compila sin `strict`.
2. `api/chat.test.ts`: `TS5097` por importar `./chat.ts`. Vercel trata **todo fichero de `api/` como una función**, así que el test se compila y se despliega como endpoint `/api/chat.test`.

`server/vercelCompile.test.ts` ya reproduce la compilación de Vercel, pero solo con `--strict`, por eso no detectó el primero.

## Criterios de aceptación

- [ ] `api/chat.ts` compila con `tsc` con y sin `--strict`
- [ ] `api/` solo contiene funciones (ningún `*.test.ts`)
- [ ] La suite, el lint, `tsc -b` y el build siguen en verde

## Tareas

### Tarea 1: Compilar sin `strict` como Vercel

- **Ficheros:** `server/vercelCompile.test.ts`, `server/chat/handleChat.ts`
- **Test (red):** el bloque `describe` se ejecuta con y sin `--strict` (directorios de salida distintos; TypeScript 6 activa `strict` por defecto, así que se desactiva con `--strict false`). La variante sin `strict` falla hoy con `TS2339` en `handleChat.ts`.
- **Implementación (green):** `readJsonBody` devuelve `{ value: unknown } | null` (`null` = cuerpo demasiado grande) en lugar de la unión discriminada por un booleano; `handleChat` comprueba `body === null`. Los tests de `handleChat.test.ts` (413) no cambian.
- **Commit:** `fix(chatbot): make body reading type-check without strict mode`
- [x] Hecho

### Tarea 2: `api/` solo contiene funciones

- **Ficheros:** `server/esmImports.test.ts`, `api/chat.test.ts` → `server/apiEntrypoint.test.ts`
- **Test (red):** nuevo caso en `esmImports.test.ts`: ningún fichero de `api/` termina en `.test.ts`. Falla hoy por `api/chat.test.ts`.
- **Implementación (green):** `git mv api/chat.test.ts server/apiEntrypoint.test.ts` y los imports pasan a `../api/chat.js`.
- **Commit:** `fix(chatbot): move the entrypoint test out of api/ so vercel does not deploy it`
- [x] Hecho

### Tarea 3: Documentación

- **Ficheros:** `docs/decisions/0004-api-del-chatbot-en-el-servidor.md`
- **Contenido:** una línea: `api/` solo contiene funciones (Vercel despliega todo lo que haya) y el código compila también sin `strict`, comprobado por `vercelCompile.test.ts`.
- **Commit:** `docs(chatbot): note vercel constraints on api/ and non-strict compile`
- [ ] Hecho

## Verificación

`npm run lint && npm run typecheck && npm run test && npm run build`. Después de fusionar, comprobar en el log de Vercel que ya no salen `TS5097` ni `TS2339`, y que `/api/chat.test` devuelve 404.

## Riesgos

- Mover el test cambia su ruta de importación; Vitest resuelve `.js` → `.ts`, igual que los demás tests de `server/`.
- Sin acciones externas: sin push ni PR hasta que lo pidas.
