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
- **Topes duros (decisión acordada):** máximo 10 mensajes de historial, 2000 caracteres por mensaje, 6000 en total, `max_tokens` 512 y roles solo `user`/`assistant`.
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
- [ ] Hecho

### Tarea 8: Quitar el prompt y la clave del cliente

- **Ficheros:** `src/data/portfolio.ts`, `.env.example`
- **Test (red):** un test comprueba que `src/` no contiene `VITE_ANTHROPIC_API_KEY` ni `CHATBOT_SYSTEM_PROMPT`. Falla hoy.
- **Implementación (green):** borrar `CHATBOT_SYSTEM_PROMPT` de `portfolio.ts`; `.env.example` documenta `ANTHROPIC_API_KEY` y `CHAT_MODEL` (sin prefijo `VITE_`).
- **Commit:** `fix(chatbot): remove api key and system prompt from client code` + `Refs #10`
- [ ] Hecho

### Tarea 9: Guardia de secretos en el bundle

- **Ficheros:** `scripts/check-bundle-secrets.mjs`, `scripts/check-bundle-secrets.test.mjs`, `.github/workflows/ci.yml`, `package.json`
- **Test (red):** el script falla (código 1) si algún fichero de un directorio contiene `sk-ant-` o `VITE_ANTHROPIC`, y pasa en uno limpio.
- **Implementación (green):** script `npm run check:bundle`; el CI lo ejecuta tras `npm run build`.
- **Commit:** `ci: fail the build if the bundle contains api keys` + `Refs #10`
- [ ] Hecho

### Tarea 10: Documentación

- **Ficheros:** `docs/decisions/0004-api-del-chatbot-en-el-servidor.md`, `docs/decisions/README.md`, `README.md`, `CLAUDE.md`, `docs/AI-WORKFLOW.md`
- **Contenido:** ADR 0004 con las decisiones y las alternativas; quitar "Limitaciones conocidas" del README; actualizar el área `chatbot` (`server/`, `api/`) y la variable `ANTHROPIC_API_KEY`.
- **Commit:** `docs(chatbot): document server-side chat api` + `Refs #10`
- [ ] Hecho

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
