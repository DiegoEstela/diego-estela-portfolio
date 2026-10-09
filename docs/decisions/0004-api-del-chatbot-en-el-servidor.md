# 0004. La API del chatbot vive en el servidor

- **Estado:** Aceptada
- **Área:** chatbot
- **Origen:** issue #10

## Contexto

El chatbot llamaba a Anthropic directamente desde el navegador con `VITE_ANTHROPIC_API_KEY` y la cabecera `anthropic-dangerous-direct-browser-access`. Todo `VITE_*` se incrusta en el bundle público.

Se comprobó con un build de `main` y una clave falsa en el entorno: el bundle contenía la clave, la cabecera de acceso directo y el prompt del sistema. Cualquier visitante podía extraer la clave y gastar el crédito, o leer el prompt.

Detalle que despista: **sin** la variable definida en el build, el minificador elimina la rama que llama a la API y el bundle parece limpio. El problema solo aparece en producción, donde la variable sí está definida.

## Decisión

El navegador llama a `/api/chat` y el servidor guarda la clave y el prompt.

- `api/chat.ts` es una función de Vercel fina; la lógica vive en `server/chat/` (validación, límite de uso, orquestación, adaptador del SDK) y se prueba sin red inyectando el cliente del proveedor.
- **Topes duros** por petición: 10 mensajes, 4000 caracteres por mensaje, 16000 en total, `max_tokens` 512 y solo roles `user`/`assistant`. El cliente no puede elegir el prompt del sistema.
- **Límite de uso en memoria por IP** (10/min y 40/h) y comprobación de que `Origin` coincide con el `Host`.
- Los errores del proveedor se reducen a códigos estables (`no_credits`, `rate_limit`, `upstream`); nunca se devuelven mensajes ni trazas.
- En desarrollo, un plugin de Vite sirve `/api/chat` con el mismo handler, así `npm run dev` no cambia.
- `npm run check:bundle` falla el CI si `dist/` contiene una clave `sk-ant-`, una variable `VITE_` de Anthropic, el prompt del servidor o la cabecera de acceso directo.

## Alternativas descartadas

- **Mantener la llamada en el navegador con otra clave:** sigue siendo extraíble; solo cambia a quién se le gasta.
- **Límite de uso en Upstash/Redis:** es el único límite realmente global, pero exige una cuenta y variables nuevas. Se deja como mejora futura.
- **`vercel dev` para el desarrollo local:** cambia el flujo y exige iniciar sesión en Vercel.

## Consecuencias

- La clave ya no puede filtrarse por el bundle, y una regresión rompe el CI.
- **El límite por IP es de mejor esfuerzo:** cada instancia serverless tiene su propia memoria, así que no es global. La defensa real contra el gasto es el **límite mensual configurado en la consola de Anthropic**.
- La comprobación de `Origin` frena el uso desde otras webs, no desde scripts, que pueden falsificarla.
- El historial lo envía el cliente, que puede falsear turnos de `assistant`. El prompt del sistema no es modificable, pero el historial sí es inyectable: es inherente a este diseño sin estado y el riesgo se acota con los topes de tamaño.
- Sin cabecera `x-forwarded-for` (por ejemplo en desarrollo local) todas las peticiones comparten la misma clave del limitador; en Vercel la plataforma la rellena.
- La comprobación de origen incluye `Sec-Fetch-Site`, que un script de página no puede falsear. Se acepta `same-origin` y `none`; el resto, 403.
- Los fallos del proveedor se registran en el servidor solo con tipo, estado y clase de error, nunca con el mensaje.
- La guardia de secretos deriva sus huellas del propio fichero del prompt (tramos ASCII largos), así que editar el prompt no la desactiva en silencio. Es una red de seguridad: no detecta contenido ofuscado (base64, concatenación) y no sustituye a `server/noClientSecrets.test.ts`.
- El servidor de desarrollo maneja `.env.local` con una clave real. Vite 8.0.0–8.0.15 permitía saltarse `server.fs.deny` en Windows (GHSA-fx2h-pf6j-xcff); se actualizó a 8.3.x. No uses `--host` con una clave real.
- `npm run build` ejecuta la guardia de secretos, así que un despliegue en Vercel también falla ante una fuga, no solo el CI.
- El cliente del SDK usa `timeout` de 20 s y un único reintento, y el handler rechaza con 413 los cuerpos de más de 100 KB. La cabecera `content-length` solo se usa como atajo: las peticiones `chunked` no la llevan, así que el cuerpo se lee como flujo con un contador y se cancela al pasar el límite.
- Las funciones se importan con extensión **`.js`** (`./validate.js`), aunque el fichero sea `validate.ts`. Vercel compila `api/chat.ts` a `api/chat.js` y ejecuta el resultado como ESM nativo **sin tocar los especificadores**, así que deben nombrar el fichero compilado: TypeScript y Vite resuelven `./x.js` al `./x.ts`. Sin extensión falla (`ERR_UNSUPPORTED_DIR_IMPORT`) y con `.ts` también (`ERR_MODULE_NOT_FOUND` en `/var/task`).
- **Lección:** este fallo solo apareció en la preview. Vitest, Vite y Node 24 (que ejecuta `.ts` directamente) lo ocultan. `server/vercelCompile.test.ts` compila con `tsc` y ejecuta el JavaScript resultante con Node puro, que es lo más parecido a Vercel que se puede reproducir en local, y `server/esmImports.test.ts` vigila los especificadores.
- Pendiente: evals del chatbot y endurecimiento del prompt frente a inyección.
- La clave que estuvo expuesta debe darse por comprometida y rotarse (paso manual de la issue).
