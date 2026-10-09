# Plan: La oficina de agentes en un modal (#18)

- **Issue:** https://github.com/DiegoEstela/diego-estela-portfolio/issues/18
- **Rama:** `feat/18-agents-office-modal`
- **Área(s):** web, content
- **Tipo:** feat

## Contexto

La issue pedía una sección fija entre Projects y Experience. El autor propone algo mejor: un **botón en el Hero ("¿Cómo trabaja la IA por mí?") que abre un modal** con una escena pixel art de los agentes del repositorio. Un botón despierta curiosidad, no ocupa espacio en la página y encaja con móvil. Este plan sustituye el planteamiento de sección por el de modal; el resto del alcance (pixel art dibujado con código, datos reales de `.claude/agents/`, accesibilidad) se mantiene.

## Criterios de aceptación

- [ ] Un tercer botón del Hero abre un modal con la oficina de agentes, en es y en
- [ ] La escena es responsive: legible y táctil en un móvil de 360 px, y cómoda en escritorio
- [ ] 5 personajes (el orquestador y los 4 agentes de `.claude/agents/`) abren su ficha con ratón, táctil y teclado
- [ ] Las herramientas y el modelo de cada ficha salen de los ficheros reales, con test del lector
- [ ] El modal es accesible: `role="dialog"`, Escape, foco que entra y vuelve, scroll bloqueado detrás
- [ ] Los personajes tienen vida propia (idle y bocadillos por turnos) y se respeta `prefers-reduced-motion`
- [ ] Sin imágenes externas, sin llamadas de red y sin dependencias nuevas
- [ ] El código de la escena no entra en el bundle inicial (carga diferida)
- [ ] Lighthouse accesibilidad >= 90 y sin regresión de rendimiento

## Decisiones de diseño

Decididas con el autor:

- **Botón:** tercer CTA del Hero, con estilo propio (icono de robot y brillo suave); en móvil, apilado como los otros dos.
- **Vista:** cenital 3/4 tipo RPG. Es la que mejor se lee en pantallas pequeñas.
- **Movimiento:** vida propia más clic. Cada personaje tiene una animación idle y, por turnos, uno muestra un bocadillo de lo que hace. Sin mini-pipeline (queda para una issue futura).

Decisiones técnicas:

- **Pixel art con código, no con imágenes.** Cada sprite es una cuadrícula de caracteres con una paleta; una función los convierte en rectángulos SVG, agrupando píxeles contiguos del mismo color. Se escala sin pérdida (`shape-rendering="crispEdges"`), pesa unos pocos KB, es original (sin licencias) y admite tema claro y oscuro.
- **Personajes accesibles como botones HTML.** El SVG pinta la escena; encima van `<button>` posicionados en porcentajes. Así el teclado, los lectores de pantalla y el toque con el dedo funcionan de serie, con zonas de al menos 44 px en móvil.
- **Datos reales.** `import.meta.glob` lee `.claude/agents/*.md` en la compilación. De cada fichero se usan `name`, `tools` y `model`; el texto "qué hace" va en `es.json` y `en.json`, porque las descripciones de los ficheros están solo en español. El orquestador (Claude) no es un fichero y es una entrada fija.
- **Carga diferida.** El modal se importa con `React.lazy`, y se precarga cuando el ratón o el foco llegan al botón, para que abrirlo se sienta inmediato sin pesar en el bundle inicial.
- **Un solo bocadillo a la vez.** En pantallas pequeñas, varios bocadillos se pisarían: un "foco" rota entre los personajes cada pocos segundos. Con `prefers-reduced-motion` se desactiva la rotación y solo se anima la selección.
- **Animaciones pixeladas.** `steps()` en CSS para que el movimiento sea a saltos, como en un videojuego; se desactivan con `prefers-reduced-motion`.
- **Estructura:** `src/components/AgentsOffice/` (`agents.ts`, `sprites.ts`, `OfficeScene.tsx`, `AgentCard.tsx`, `AgentsOfficeModal.tsx`, `AgentsOffice.tsx`).

Alternativas descartadas: `<canvas>` (peor para accesibilidad y escalado), imágenes PNG generadas (peso y licencias, y no se adaptan al tema) y un modal con una librería de terceros (dependencia nueva para algo que son 60 líneas).

## Tareas

Cada tarea: 5-10 min, con su test; el proyecto compila y los tests pasan tras cada una.

### Tarea 1: Lector de los agentes reales

- **Ficheros:** `src/components/AgentsOffice/agents.ts`, `src/components/AgentsOffice/agents.test.ts`
- **Test (red):** `parseAgent` extrae `name`, `tools` y `model` del frontmatter; separa las herramientas por comas **fuera** de los paréntesis (`Bash(git diff:*)` es una sola); ignora ficheros sin `name`. `loadAgents()` devuelve los 4 agentes reales (`code-reviewer`, `content-copywriter`, `web-quality-auditor`, `security-auditor`) con herramientas y modelo no vacíos.
- **Implementación (green):** parser puro y `import.meta.glob('../../../.claude/agents/*.md', { query: '?raw', import: 'default', eager: true })`. Riesgo: que el glob ignore la carpeta oculta `.claude`; el test de los 4 agentes reales lo detecta.
- **Commit:** `feat(agents-office): read the real agent definitions at build time` + `Refs #18`
- [x] Hecho

### Tarea 2: Motor de sprites

- **Ficheros:** `src/components/AgentsOffice/sprites.ts`, `src/components/AgentsOffice/sprites.test.ts`
- **Test (red):** `spriteToRects` convierte una cuadrícula en rectángulos agrupando píxeles contiguos del mismo color (una fila `AAAB` da 2 rectángulos); ignora el carácter transparente; lanza error si una letra no está en la paleta. Todos los sprites definidos tienen filas del mismo ancho y solo letras de su paleta.
- **Implementación (green):** el conversor y los sprites: personaje base de 16×20 con variantes de color y accesorio para los 5 personajes, escritorio con monitor, planta, ventana y baldosa del suelo.
- **Commit:** `feat(agents-office): add the pixel art sprite engine and sprites` + `Refs #18`
- [x] Hecho

### Tarea 3: La escena y sus personajes accesibles

- **Ficheros:** `src/components/AgentsOffice/OfficeScene.tsx`, `src/components/AgentsOffice/OfficeScene.test.tsx`
- **Test (red):** la escena renderiza un SVG con `role="img"` y descripción, y 5 botones con nombre accesible (nombre y rol); pulsar uno, o usar Enter o Espacio, llama a `onSelect(id)`; el botón del personaje seleccionado tiene `aria-pressed="true"`.
- **Implementación (green):** SVG compuesto por los sprites, y botones posicionados en porcentajes sobre cada personaje.
- **Commit:** `feat(agents-office): render the office scene with accessible characters` + `Refs #18`
- [x] Hecho

### Tarea 4: La ficha del agente

- **Ficheros:** `src/components/AgentsOffice/AgentCard.tsx`, `src/components/AgentsOffice/AgentCard.test.tsx`, `src/locales/es.json`, `src/locales/en.json`
- **Test (red):** sin selección muestra la pista "Toca un personaje"; con un agente muestra nombre, rol traducido, herramientas como etiquetas y modelo; el orquestador no muestra herramientas ni modelo; el texto cambia al cambiar de idioma. El test de paridad de `locales.test.ts` sigue en verde.
- **Implementación (green):** componente y claves `agentsOffice.*` en ambos idiomas (rol y "qué está haciendo" de cada personaje).
- **Commit:** `feat(agents-office): add the agent details card with es/en copy` + `Refs #18`
- [x] Hecho

### Tarea 5: El modal accesible

- **Ficheros:** `src/components/AgentsOffice/AgentsOfficeModal.tsx`, `src/components/AgentsOffice/AgentsOfficeModal.test.tsx`
- **Test (red):** tiene `role="dialog"`, `aria-modal` y un título asociado; Escape y el clic en el fondo lo cierran; al abrir, el foco pasa al botón de cerrar y al cerrar vuelve al botón que lo abrió; mientras está abierto el `<body>` no hace scroll y se restaura; Tab no sale del modal.
- **Implementación (green):** modal con `framer-motion`, a pantalla completa en móvil y centrado (`max-w-4xl`) en escritorio, con scroll interno.
- **Commit:** `feat(agents-office): add the accessible modal shell` + `Refs #18`
- [x] Hecho

### Tarea 6: Vida propia: foco rotativo y animaciones

- **Ficheros:** `src/components/AgentsOffice/useSpotlight.ts`, `src/components/AgentsOffice/useSpotlight.test.ts`, `src/components/AgentsOffice/OfficeScene.tsx`, `src/styles/globals.css`
- **Test (red):** con temporizadores simulados, el foco rota por los 5 personajes cada ~3,5 s y vuelve al primero; con `reduced` activo no rota; al seleccionar un personaje el foco se queda en él. La escena muestra un único bocadillo.
- **Implementación (green):** hook `useSpotlight`, bocadillo con el texto "qué está haciendo", y animaciones CSS pixeladas (`steps()`: teclear, parpadear, balanceo) desactivadas con `@media (prefers-reduced-motion: reduce)`.
- **Commit:** `feat(agents-office): animate the characters with a rotating spotlight` + `Refs #18`
- [x] Hecho

### Tarea 7: El botón del Hero y la carga diferida

- **Ficheros:** `src/components/AgentsOffice/AgentsOffice.tsx`, `src/components/AgentsOffice/AgentsOffice.test.tsx`, `src/components/Hero/Hero.tsx`, `src/locales/es.json`, `src/locales/en.json`
- **Test (red):** el botón muestra "¿Cómo trabaja la IA por mí?" / "How does AI work for me?" según el idioma; al pulsarlo aparece el diálogo (esperando a la carga diferida); al cerrarlo desaparece; pasar el ratón o el foco por encima precarga el modal.
- **Implementación (green):** componente con `React.lazy` y precarga; se inserta en la fila de botones del Hero, que pasa a `flex-wrap` para que tres botones no se rompan entre 640 y 768 px.
- **Commit:** `feat(agents-office): add the hero button that opens the office` + `Refs #18`
- [x] Hecho

### Tarea 8: Documentación

- **Ficheros:** `docs/decisions/0005-oficina-de-agentes-pixel-art-con-codigo.md`, `docs/decisions/README.md`, `README.md`, `docs/AI-WORKFLOW.md`
- **Contenido:** ADR 0005 con las decisiones y alternativas; la web enseña los agentes reales a partir de sus ficheros; mención en el README y en el flujo de IA.
- **Commit:** `docs(agents-office): document the office and its design decisions` + `Refs #18`
- [x] Hecho

### Tarea 9: Resistencia y respuesta de la carga diferida

> Añadida tras la revisión de `code-reviewer`.

- **Ficheros:** `src/components/AgentsOffice/AgentsOffice.tsx`, `AgentsOfficeModal.tsx`, `AgentsOffice.resilience.test.tsx`, `src/locales/*.json`
- **Test (red):** si falla la descarga del chunk, la página sigue viva, aparece un aviso `role="alert"` y un segundo clic reintenta; el precargado fallido no deja un `unhandledrejection`; mientras carga se ve un indicador `role="status"` y desaparece al abrir; el foco vuelve al botón aunque el visitante lo moviera mientras cargaba.
- **Implementación (green):** *error boundary* local, `.catch` en el precargado, fallback con indicador, y el botón se pasa al modal como destino del foco.
- **Commit:** `fix(agents-office): survive a failed chunk load and show progress` + `Refs #18`
- [x] Hecho

### Tarea 10: Pulido del modal

> Añadida tras la revisión.

- **Ficheros:** `AgentsOfficeModal.tsx`, `AgentCard.tsx`, sus tests, `src/styles/globals.css`, `src/locales/*.json`
- **Test (red):** al reabrir, la rotación y la selección empiezan de cero; al elegir un personaje la ficha se desplaza a la vista; la selección se anuncia con una línea breve (`role="status"`) y no con toda la ficha; la página reserva el hueco de la barra de scroll (`scrollbar-gutter: stable`).
- **Implementación (green):** el contenido del diálogo pasa a un componente interno que solo existe mientras está abierto; `scrollIntoView({ block: 'nearest' })`; `overscroll-contain`; claves de lista por índice.
- **Commit:** `fix(agents-office): reset the dialog on reopen and announce selections briefly` + `Refs #18`
- [x] Hecho

### Tarea 11: Brillo del botón sin repintados y textos coherentes con los datos

> Añadida tras la revisión.

- **Ficheros:** `src/styles/globals.css`, `animations.test.ts`, `agents.ts`, `agents.test.ts`, `AgentCard.tsx`
- **Test (red):** el pulso se anima sobre un pseudo-elemento con `opacity` (no sobre `box-shadow`); para cada agente real, "puede editar" en su texto coincide con tener una herramienta de edición.
- **Implementación (green):** `.agents-cta::after`; `canEditFiles` pasa a `agents.ts` y se prueba.
- **Commit:** `fix(agents-office): pulse the hero button without repaints` + `Refs #18`
- [x] Hecho

### Tarea 12: Contraste y foco, medidos con los colores reales

> Añadida tras la auditoría de `web-quality-auditor`. Cifras verificadas con la fórmula WCAG: insignia "Orquestador" 2,90:1 en oscuro, texto del botón del Hero 3,70:1 en oscuro, foco de los personajes 1,69:1 en claro (la escena es siempre oscura).

- **Ficheros:** `src/components/AgentsOffice/AgentCard.tsx`, `AgentsOffice.tsx`, `OfficeScene.tsx`, `layout.ts`, `src/styles/globals.css`, `a11y-contrast.test.tsx`
- **Test (red):** con los valores de `:root` y `.light` leídos de `globals.css`, el texto de la insignia, el texto del botón del Hero (sobre su tinte) y el anillo de foco (sobre la pared y el suelo) superan 4,5:1, 4,5:1 y 3:1; la región `role="status"` existe siempre y solo cambia su texto.
- **Implementación (green):** insignia con `var(--bg-primary)`; el tinte del botón pasa a `.agents-cta` con `color-mix(... 14%)`; anillo de foco y de selección con un color fijo (`#7EC8E3`), ya que la escena no cambia con el tema; región viva siempre montada.
- **Commit:** `fix(agents-office): meet contrast minimums in both themes` + `Refs #18`
- [x] Hecho

## Riesgos y verificación

- Comandos: `npm run lint`, `npm run typecheck`, `npm run test`, `npm run build` (incluye `check:bundle`).
- **Peso:** tras `npm run build`, comprobar que el código de la escena queda en un chunk aparte y que el bundle inicial no crece de forma apreciable.
- **Manual en la preview** (la tuya):
  1. Móvil real o DevTools a 360 px: el botón se ve completo, el modal ocupa la pantalla, los 5 personajes se tocan con el dedo y las fichas se leen sin desbordar.
  2. Escritorio: el modal se centra y la ficha aparece sin saltos.
  3. Teclado: Tab llega al botón, Enter abre, Tab recorre los personajes, Escape cierra y el foco vuelve al botón.
  4. Tema claro y oscuro, y español e inglés.
  5. Sistema con "reducir movimiento": la escena no se anima sola.
- Riesgo: el glob puede no incluir la carpeta oculta `.claude`; lo cubre el test de la tarea 1.
- Riesgo: el aspecto del pixel art es subjetivo; se ajusta en la preview, no con tests.
- Fuera de alcance (issues futuras): botón "Ejecutar pipeline" con la animación issue → plan → TDD → PR, y tickets reales leídos de la API de GitHub.

## Preguntas abiertas

Ninguna. Decididas con el autor: tercer botón del Hero, vista cenital 3/4 y vida propia más clic.
