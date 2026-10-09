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
- Pendiente: evals del chatbot y endurecimiento del prompt frente a inyección.
- La clave que estuvo expuesta debe darse por comprometida y rotarse (paso manual de la issue).
