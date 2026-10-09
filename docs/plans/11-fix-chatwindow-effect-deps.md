# Plan: Corregir dependencias del useEffect en ChatWindow (#11)

- **Issue:** https://github.com/DiegoEstela/diego-estela-portfolio/issues/11
- **Rama:** `fix/11-chatwindow-effect-deps`
- **Área(s):** web
- **Tipo:** fix

## Contexto

`npm run lint` avisa en `src/components/Chatbot/ChatWindow.tsx:45` (`react-hooks/exhaustive-deps`): el efecto de las líneas 34-45 usa `isOpen` y `t` pero solo depende de `[i18n.language]`. Existen dos efectos que escriben el mensaje de bienvenida (líneas 20-32 y 34-45), lo que duplica lógica.

Un arreglo ingenuo (añadir `isOpen` y `t` a las dependencias) **introduce un bug**: el efecto reiniciaría la conversación cada vez que se abre o cierra el chat, y hoy la conversación se conserva al cerrar y reabrir.

## Criterios de aceptación

- [ ] `npm run lint` sin warnings
- [ ] Test que cubra el mensaje inicial al cambiar de idioma
- [ ] Cerrar y reabrir el chat no borra la conversación

## Decisiones de diseño

**Derivar el saludo en vez de guardarlo en el estado.** El mensaje de bienvenida es una función pura de `t('chatbot.initial')`, no estado. Se calcula con `useMemo` y se antepone a `messages` al renderizar.

- Se eliminan `initialized` y los dos efectos de inicialización: sin efectos no hay dependencias que arreglar.
- El saludo cambia de idioma automáticamente al cambiar `i18n.language`.
- `messages` solo contiene mensajes reales; el filtro `m.id !== 'init'` del historial deja de ser necesario.

Alternativa descartada: mantener los efectos y añadir un `useRef` con el idioma anterior. Funciona, pero conserva la duplicación y la complejidad.

**Cambio de comportamiento (ver Preguntas abiertas):** hoy, al cambiar de idioma con el chat abierto, se **borra toda la conversación**. Con el saludo derivado, la conversación se conserva y solo se retraduce el saludo.

## Tareas

Cada tarea: 5-10 min, con su test; el proyecto funciona tras cada una.

### Tarea 1: Preparar el entorno de test del chat

- **Ficheros:** `src/test/setup.ts`
- **Test (red):** un test trivial que renderiza `ChatWindow` falla porque jsdom no implementa `Element.prototype.scrollIntoView`.
- **Implementación (green):** definir `scrollIntoView` como `vi.fn()` en `setup.ts`.
- **Commit:** `test(chatbot): mock scrollIntoView in jsdom setup` + `Refs #11`
- [x] Hecho

### Tarea 2: Test de caracterización del saludo y del cambio de idioma

- **Ficheros:** `src/components/Chatbot/ChatWindow.test.tsx` (nuevo)
- **Test:** se renderiza `ChatWindow` dentro de `ChatContext.Provider` con `isOpen: true` e `import '@/i18n'`. Casos:
  1. muestra `chatbot.initial` en es;
  2. tras `i18n.changeLanguage('en')` muestra el saludo en inglés.
  Con el código actual **ya pasan** (caracterizan el comportamiento actual, protegen el refactor).
- **Commit:** `test(chatbot): cover initial greeting and language change` + `Refs #11`
- [x] Hecho

### Tarea 3: Test rojo, la conversación sobrevive al cambio de idioma

- **Ficheros:** `src/components/Chatbot/ChatWindow.test.tsx`
- **Test (red):** con `vi.stubEnv('VITE_ANTHROPIC_API_KEY', '')` el envío no llama a la red y responde con `chatbot.error`. Se escribe un mensaje, se cambia el idioma y se espera que el mensaje del usuario siga visible. **Falla** hoy porque el segundo efecto reinicia `messages`.
- **Commit:** se une al de la tarea 4 (el test rojo no se commitea solo).
- [x] Hecho

### Tarea 4: Derivar el saludo y eliminar los efectos

- **Ficheros:** `src/components/Chatbot/ChatWindow.tsx`
- **Implementación (green):**
  - quitar el estado `initialized` y los efectos de las líneas 20-45;
  - `const greeting = useMemo<ChatMessageType>(() => ({ id: 'init', role: 'assistant', content: t('chatbot.initial'), timestamp: new Date() }), [t])`;
  - renderizar `[greeting, ...messages]`;
  - quitar el `.filter((m) => m.id !== 'init')` del historial (línea 77);
  - importar `useMemo`.
- **Verificación:** tareas 2 y 3 en verde, `npm run lint` sin warnings.
- **Commit:** `fix(chatbot): derive greeting to remove effect dependency warning` + `Refs #11`
- [x] Hecho

### Tarea 5: Test de persistencia al cerrar y reabrir

- **Ficheros:** `src/components/Chatbot/ChatWindow.test.tsx`
- **Test:** con `rerender` alternando `isOpen` de `true` a `false` y `true`, el mensaje del usuario sigue ahí (protege el bug que evitamos al no añadir `isOpen` a los efectos).
- **Commit:** `test(chatbot): keep conversation when chat is closed and reopened` + `Refs #11`
- [ ] Hecho

## Riesgos y verificación

- Comandos: `npm run lint` (0 warnings), `npm run typecheck`, `npm run test`, `npm run build`.
- Manual: abrir el chat, enviar un mensaje, cerrar y reabrir (la conversación sigue), cambiar es ↔ en (el saludo se traduce).
- Riesgo: `AnimatePresence` desmonta el contenido al cerrar; el estado vive en `ChatWindow`, que no se desmonta, por lo que la conversación persiste. Lo cubre la tarea 5.
- Este plan **no toca** la llamada a la API: eso es la issue #10.

## Preguntas abiertas

Ninguna. Resuelto con el autor: al cambiar de idioma **se conserva la conversación** y solo se retraduce el saludo.
