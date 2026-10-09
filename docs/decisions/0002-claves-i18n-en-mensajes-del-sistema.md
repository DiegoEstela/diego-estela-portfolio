# 0002. Los mensajes del sistema del chat guardan una clave i18n

- **Estado:** Aceptada
- **Área:** web, chatbot
- **Origen:** issue #11, PR #17

## Contexto

`ChatWindow` guardaba en el estado el texto ya traducido de los mensajes de error. Al conservar la conversación al cambiar de idioma, esos mensajes se quedaban en el idioma antiguo. El defecto lo encontró una prueba manual en la preview de Vercel; ningún test lo cubría porque no existía.

## Decisión

`ChatMessage` gana un campo opcional `contentKey`. Los mensajes del sistema (`error`, `no_credits`, `rate_limit`) guardan la clave y se traducen al renderizar con `t(contentKey)`. El saludo inicial se deriva con `useMemo` en lugar de guardarse en el estado.

## Alternativas descartadas

- **Reiniciar la conversación al cambiar de idioma** (comportamiento anterior): pierde el hilo del usuario y exige un efecto con `useRef`.
- **Re-traducir en un efecto al cambiar `i18n.language`**: duplica el estado y reintroduce los efectos con dependencias.

## Consecuencias

- Los mensajes del sistema siguen el idioma activo sin efectos adicionales.
- Los mensajes del modelo (texto libre) no se traducen: son contenido, no interfaz.
- Cubierto por tests de regresión en `ChatWindow.test.tsx`.
