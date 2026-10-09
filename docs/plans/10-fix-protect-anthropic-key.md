# Plan: Proteger la API key de Anthropic con una función serverless (#10)

- **Issue:** https://github.com/DiegoEstela/diego-estela-portfolio/issues/10
- **Rama:** `fix/10-protect-anthropic-key`
- **Área(s):** chatbot (con retoques en web e infra)
- **Tipo:** fix

## Contexto

`ChatWindow.tsx` lee `import.meta.env.VITE_ANTHROPIC_API_KEY` y llama a `https://api.anthropic.com/v1/messages` desde el navegador con la cabecera `anthropic-dangerous-direct-browser-access`. Todo `VITE_*` se incrusta en el bundle público, así que cualquiera puede extraer la clave y gastar el crédito. El `CHATBOT_SYSTEM_PROMPT` (`src/data/portfolio.ts`) también viaja en el bundle.

Objetivo: la clave y el prompt viven solo en el servidor, y el servidor limita el abuso.

## Criterios de aceptación

- [ ] La clave no aparece en `dist/` (comprobado automáticamente en CI)
- [ ] Tests del handler: entrada inválida, límite de uso, error del proveedor
- [ ] El chatbot sigue funcionando en es y en
- [ ] `VITE_ANTHROPIC_API_KEY` eliminada del código y de `.env.example`

## Decisiones de diseño

Documentación de Vercel consultada con context7: en un proyecto Vite, los ficheros de `api/*.ts` son funciones sin configuración, y un export `POST` recibe un `Request` web y devuelve un `Response`.

- **`api/chat.ts` fino, lógica en `server/chat/`.** La lógica (validación, límite, orquestación) va en módulos puros y testeables fuera de `api/`, para no depender de cómo Vercel trata los ficheros auxiliares dentro de `api/`.
- **Cliente del proveedor inyectado.** El handler recibe una función `complete(messages)`; los tests usan un doble y el adaptador de `@anthropic-ai/sdk` (ya está en `dependencies` y hoy no se usa) se prueba aparte.
- **Contrato de respuesta estable:** `200 {reply}`; errores `{error: <código>}` con códigos `invalid_request`, `forbidden_origin`, `rate_limit`, `no_credits`, `upstream`, `not_configured`. Nunca se devuelve el mensaje del proveedor.
- **Topes duros (decisión acordada):** máximo 10 mensajes de historial, 4000 caracteres por mensaje, 16000 en total (ajustado en la tarea 11), `max_tokens` 512 y roles solo `user`/`assistant`.
- **Límite de uso en memoria por IP** (decisión acordada): 10 peticiones/minuto y 40/hora. Es de **mejor esfuerzo**: cada instancia serverless tiene su propia memoria. La defensa real contra el gasto es el límite mensual de la consola de Anthropic (ver pasos manuales).
- **Comprobación de origen:** si llega `Origin`, debe coincidir con el `Host` de la petición. Frena el uso desde otras webs; no es una barrera contra scripts.
- **Dev local (decisión acordada):** un plugin de Vite sirve `/api/chat` con el mismo handler, así `npm run dev` no cambia.
- **Modelo (decisión acordada):** se mantiene `claude-haiku-4-5`, configurable con `CHAT_MODEL` en el servidor.
- **Sin cambio de comportamiento visible:** los mensajes `error`, `no_credits` y `rate_limit` se conservan.

## Tareas

Cada tarea: 5-10 min, con su test; el proyecto compila y los tests pasan tras cada una.

### Tarea 1: Validación de la petición

- **Ficheros:** `server/chat/validate.ts`, `server/chat/validate.test.ts`
- **Test (red):** `parseChatRequest` rechaza JSON inválido, `messages` vacío o no array, más de 10 mensajes, roles distintos de `user`/`assistant`, contenido no string o vacío, mensajes de más de 2000 caracteres, total de más de 6000, y un historial que no termina en `user`. Acepta un historial válido.
- **Implementación (green):** función pura que devuelve `{ok: true, messages}` o `{ok: false}`.
- **Commit:** `feat(chatbot): validate chat requests on the server` + `Refs #10`
- [x] Hecho

### Tarea 2: Limitador de uso

- **Ficheros:** `server/chat/rateLimit.ts`, `server/chat/rateLimit.test.ts`
- **Test (red):** con un reloj falso, permite 10 peticiones por minuto y rechaza la 11.ª; se recupera al pasar la ventana; cuenta cada IP por separado; aplica el tope de 40/hora; limpia entradas antiguas.
- **Implementación (green):** `createRateLimiter({perMinute, perHour, now})` con ventana deslizante en un `Map`.
- **Commit:** `feat(chatbot): add in-memory rate limiter` + `Refs #10`
- [x] Hecho

### Tarea 3: Handler: método, origen, validación y límite

- **Ficheros:** `server/chat/handleChat.ts`, `server/chat/handleChat.test.ts`, `server/chat/systemPrompt.ts`
- **Test (red):** con un `complete` falso: método distinto de POST → 405; `Origin` ajeno → 403 `forbidden_origin`; cuerpo inválido → 400 `invalid_request`; límite superado → 429 `rate_limit`; petición válida → 200 `{reply}` y `complete` recibe el prompt del servidor.
- **Implementación (green):** `handleChat(request, deps)`; el prompt del chatbot se copia a `server/chat/systemPrompt.ts` (aún sin borrarlo del cliente).
- **Commit:** `feat(chatbot): add chat handler with origin and rate checks` + `Refs #10`
- [x] Hecho

### Tarea 4: Handler: errores del proveedor

- **Ficheros:** `server/chat/handleChat.ts`, `server/chat/handleChat.test.ts`
- **Test (red):** `complete` que lanza error de facturación (402) → 402 `no_credits`; error 429 del proveedor → 429 `rate_limit`; cualquier otro error → 502 `upstream` sin filtrar su mensaje; respuesta vacía → 502 `upstream`.
- **Implementación (green):** mapeo de errores a códigos estables.
- **Commit:** `feat(chatbot): map provider errors to stable codes` + `Refs #10`
- [x] Hecho

### Tarea 5: Adaptador de Anthropic y función de Vercel

- **Ficheros:** `server/chat/anthropic.ts`, `server/chat/anthropic.test.ts`, `api/chat.ts`, `tsconfig.server.json`, `tsconfig.json`
- **Test (red):** el adaptador llama a `messages.create` con `model` (`CHAT_MODEL` o `claude-haiku-4-5`), `max_tokens: 512`, `system` y los mensajes, y devuelve el texto del primer bloque; sin `ANTHROPIC_API_KEY` el handler responde 500 `not_configured` sin llamar al proveedor.
- **Implementación (green):** `createAnthropicCompleter` con `@anthropic-ai/sdk`; `api/chat.ts` exporta `POST` y delega en `handleChat`; `tsconfig.server.json` se añade a las referencias para que `tsc -b` lo compruebe.
- **Commit:** `feat(chatbot): add anthropic adapter and /api/chat function` + `Refs #10`
- [x] Hecho

### Tarea 6: Plugin de Vite para desarrollo local

- **Ficheros:** `vite-plugins/apiDev.ts`, `vite-plugins/apiDev.test.ts`, `vite.config.ts`
- **Test (red):** `toWebRequest` convierte una petición de Node (método, URL, cabeceras, cuerpo) en un `Request` web y `sendWebResponse` escribe estado, cabeceras y cuerpo de un `Response`.
- **Implementación (green):** plugin que atiende `/api/chat` con el mismo handler y lee `ANTHROPIC_API_KEY` de `.env.local` con `loadEnv(mode, cwd, '')`.
- **Commit:** `feat(chatbot): serve /api/chat in vite dev` + `Refs #10`
- [x] Hecho

### Tarea 7: El cliente usa /api/chat

- **Ficheros:** `src/components/Chatbot/ChatWindow.tsx`, `src/components/Chatbot/ChatWindow.test.tsx`
- **Test (red):** con `fetch` simulado: el envío hace `POST /api/chat` con `{messages}` y **sin** cabecera `x-api-key`; muestra `reply`; 402 → `chatbot.no_credits`; 429 → `chatbot.rate_limit`; cualquier otro fallo → `chatbot.error`. Los tests actuales que simulan "sin clave" se adaptan a una respuesta de error del servidor.
- **Implementación (green):** sustituir la llamada directa a Anthropic y la lectura de `VITE_ANTHROPIC_API_KEY`; el historial sigue enviando los últimos 10 mensajes.
- **Commit:** `fix(chatbot): call /api/chat instead of anthropic from the browser` + `Refs #10`
- [x] Hecho

### Tarea 8: Quitar el prompt y la clave del cliente

- **Ficheros:** `src/data/portfolio.ts`, `.env.example`
- **Test (red):** un test comprueba que `src/` no contiene `VITE_ANTHROPIC_API_KEY` ni `CHATBOT_SYSTEM_PROMPT`. Falla hoy.
- **Implementación (green):** borrar `CHATBOT_SYSTEM_PROMPT` de `portfolio.ts`; `.env.example` documenta `ANTHROPIC_API_KEY` y `CHAT_MODEL` (sin prefijo `VITE_`).
- **Commit:** `fix(chatbot): remove api key and system prompt from client code` + `Refs #10`
- [x] Hecho

### Tarea 9: Guardia de secretos en el bundle

- **Ficheros:** `scripts/check-bundle-secrets.mjs`, `scripts/check-bundle-secrets.test.mjs`, `.github/workflows/ci.yml`, `package.json`
- **Test (red):** el script falla (código 1) si algún fichero de un directorio contiene `sk-ant-` o `VITE_ANTHROPIC`, y pasa en uno limpio.
- **Implementación (green):** script `npm run check:bundle`; el CI lo ejecuta tras `npm run build`.
- **Commit:** `ci: fail the build if the bundle contains api keys` + `Refs #10`
- [x] Hecho

### Tarea 10: Documentación

- **Ficheros:** `docs/decisions/0004-api-del-chatbot-en-el-servidor.md`, `docs/decisions/README.md`, `README.md`, `CLAUDE.md`, `docs/AI-WORKFLOW.md`
- **Contenido:** ADR 0004 con las decisiones y las alternativas; quitar "Limitaciones conocidas" del README; actualizar el área `chatbot` (`server/`, `api/`) y la variable `ANTHROPIC_API_KEY`.
- **Commit:** `docs(chatbot): document server-side chat api` + `Refs #10`
- [x] Hecho

### Tarea 11: Los topes no deben rechazar conversaciones normales

> Añadida tras la revisión de `code-reviewer`.

- **Ficheros:** `server/chat/validate.ts`, `server/chat/validate.test.ts`, `src/components/Chatbot/ChatWindow.tsx`, `src/components/Chatbot/ChatWindow.test.tsx`
- **Test (red):** un historial de 10 turnos con respuestas del bot de 1500 caracteres es válido; el campo de texto limita la entrada a 1000 caracteres.
- **Implementación (green):** `maxMessageChars` 4000 y `maxTotalChars` 16000 (cota de coste sigue acotada); `maxLength={1000}` en el `<input>`.
- **Commit:** `fix(chatbot): raise request caps so normal conversations are accepted` + `Refs #10`
- [x] Hecho

### Tarea 12: Imports con extensión para el runtime ESM de Vercel

> Añadida tras la revisión. La documentación de Vercel usa imports con extensión en funciones TypeScript con `"type": "module"`.

- **Ficheros:** `api/chat.ts`, `server/chat/*.ts` (no tests), `server/esmImports.test.ts`
- **Test (red):** todos los imports relativos de `api/` y `server/` (excepto tests) terminan en `.ts`.
- **Implementación (green):** añadir la extensión; `'../server/chat'` pasa a `'../server/chat/index.ts'`.
- **Commit:** `fix(chatbot): use explicit import extensions for vercel esm runtime` + `Refs #10`
- [x] Hecho

### Tarea 13: Endurecimiento menor

> Añadida tras la revisión.

- **Ficheros:** `server/chat/handleChat.ts`, `server/chat/handleChat.test.ts`, `server/chat/index.ts`, `api/chat.test.ts`, `package.json`
- **Test (red):** cuerpo de más de 100 KB → 413 sin llegar al modelo; `api/chat.ts` exporta `POST` y un `GET` devuelve 405.
- **Implementación (green):** comprobar `content-length` antes de leer el cuerpo; el cliente del SDK con `timeout` de 20 s y `maxRetries` 1; `npm run build` ejecuta la guardia de secretos, para que Vercel también falle si hay una fuga.
- **Commit:** `fix(chatbot): bound body size and provider latency` + `Refs #10`
- [x] Hecho

### Tarea 14: El handler no se fía de las cabeceras para limitar el cuerpo

> Añadida tras la auditoría de `security-auditor`.

- **Ficheros:** `server/chat/handleChat.ts`, `server/chat/providerError.ts`, `server/chat/anthropic.ts`, y sus tests
- **Test (red):** un cuerpo en streaming sin `content-length` se corta con 413 tras leer ~100 KB (no se consume entero); una petición con `Sec-Fetch-Site: cross-site` recibe 403; un fallo del proveedor se registra con `kind` y `status` sin incluir mensajes ni claves.
- **Implementación (green):** lectura del cuerpo con contador y cancelación; comprobación de `Sec-Fetch-Site`; `console.error` mínimo; `ProviderError` conserva el `status` original.
- **Commit:** `fix(chatbot): bound the request body even without content-length` + `Refs #10`
- [x] Hecho

### Tarea 15: Guardia de secretos más difícil de eludir

> Añadida tras la auditoría.

- **Ficheros:** `scripts/check-bundle-secrets.mjs`, `scripts/check-bundle-secrets.test.mjs`
- **Test (red):** la guardia detecta fragmentos de **cualquier** línea larga del prompt real (leído de `server/chat/systemPrompt.ts`), no solo la frase inicial, y claves con formato `sk-<proveedor>-…`.
- **Implementación (green):** los fragmentos se derivan del fichero del prompt, así que editar el prompt no desactiva la guardia.
- **Commit:** `ci: derive bundle guard patterns from the real system prompt` + `Refs #10`
- [x] Hecho

### Tarea 16: Vite sin la vulnerabilidad de `server.fs.deny`

> Añadida tras la auditoría: `vite` 8.0.0–8.0.15 permite saltarse `server.fs.deny` en rutas alternativas de Windows, y el servidor de desarrollo ahora maneja `.env.local` con una clave real.

- **Ficheros:** `package.json`, `package-lock.json`, `README.md`, `.env.example`
- **Verificación:** `npm audit --omit=dev` ya no lista `vite`; lint, tests y build en verde. Documentar no usar `--host` con una clave real.
- **Commit:** `build(deps): update vite to fix the dev server fs.deny bypass` + `Refs #10`
- [x] Hecho

### Tarea 17: Imports `.js` y una prueba que reproduce la compilación de Vercel

> Añadida tras el fallo de la preview (`FUNCTION_INVOCATION_FAILED`): Vercel compila `api/chat.ts` a `api/chat.js` y deja intactos los especificadores, así que `../server/chat/index.ts` no existe en `/var/task`. La tarea 12 había sustituido un fallo por otro: los imports `.ts` solo funcionan donde Node lee TypeScript directamente.

- **Ficheros:** `api/chat.ts`, `server/chat/*.ts` (no tests), `server/esmImports.test.ts`, `server/vercelCompile.test.ts`
- **Test (red):** compilar `api/chat.ts` con `tsc` (módulo `nodenext`, sin reescribir especificadores) y ejecutar el resultado con Node puro: `POST` con cuerpo `{}` y clave configurada responde 400, y sin clave 500 `not_configured`. Además, todos los imports relativos de `api/` y `server/` terminan en `.js`.
- **Implementación (green):** especificadores `.js` (`../server/chat/index.js`), que TypeScript y Vite resuelven a los `.ts`.
- **Commit:** `fix(chatbot): import with .js extensions so compiled functions resolve` + `Refs #10`
- [x] Hecho

## Pasos manuales (los haces tú, antes de fusionar)

1. **Rotar la clave actual.** Estuvo en el bundle público, así que hay que darla por comprometida: crea una nueva en https://console.anthropic.com/settings/keys y revoca la anterior.
2. **Poner un límite de gasto mensual** en la consola de Anthropic (es la defensa real; el límite por IP es de mejor esfuerzo).
3. **En Vercel (Settings → Environment Variables):** añadir `ANTHROPIC_API_KEY` para **Production y Preview**, y borrar `VITE_ANTHROPIC_API_KEY`. Sin la de Preview, la preview del PR no podrá responder.
4. Tras fusionar, comprobar en producción que el chat responde.

## Riesgos y verificación

- Comandos: `npm run lint`, `npm run typecheck`, `npm run test`, `npm run build`, `npm run check:bundle`.
- Manual en la preview (después del paso 3): el chat responde en es y en; abrir DevTools → Network y comprobar que la petición va a `/api/chat` y que **ninguna** cabecera ni respuesta contiene la clave.
- Manual: buscar `sk-ant` en las fuentes de la página (Sources) y no encontrarlo.
- Riesgo: el límite en memoria no es global; un atacante repartido entre instancias puede superarlo. Mitigación: topes por petición, `max_tokens` y límite de gasto en Anthropic. Una mejora futura es Upstash.
- Riesgo: un fallo del plugin de dev no afecta a producción, que usa `api/chat.ts` directamente.
- Fuera de alcance: evals del chatbot y endurecimiento del prompt frente a inyección; se tratarán en un cambio aparte.

## Preguntas abiertas

Ninguna. Decididas con el autor: límite en memoria con topes duros, plugin de Vite para desarrollo local y modelo `claude-haiku-4-5`.
