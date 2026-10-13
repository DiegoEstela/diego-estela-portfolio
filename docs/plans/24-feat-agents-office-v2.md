# Plan: Oficina de agentes v2: sofá de descanso y pizarra con el plan actual (#24)

- **Issue:** https://github.com/DiegoEstela/diego-estela-portfolio/issues/24
- **Rama:** `feat/24-oficina-agentes-v2`
- **Área(s):** web, content
- **Tipo:** feat

## Contexto

La oficina de agentes (#18) ya está en producción. La issue añade dos piezas que cuentan **qué pasa en el repositorio**: una **pizarra** clicable que muestra el último plan de `docs/plans/` con su progreso real, y un **sofá** al que los personajes se van a descansar cuando el plan está completo. Todo se calcula al compilar, sin red.

## Criterios de aceptación

- [ ] La pizarra y el sofá aparecen en la escena, en móvil (360 px) y en escritorio, sin tapar a ningún personaje
- [ ] Al tocar la pizarra se ve el último plan con su progreso, leído de `docs/plans/` al compilar, con test del lector (planes sin tareas, sin marcar, con todas marcadas y ausencia de planes)
- [ ] El estado de descanso se deriva del plan, con test, y la escena lo refleja con una pose distinta
- [ ] Todo es accesible con teclado y lector de pantalla, con zonas táctiles >= 44 px, y respeta `prefers-reduced-motion`
- [ ] Contraste >= 4,5:1 (texto) y >= 3:1 (anillos y barra) en tema claro y oscuro, y los tests de colocación cubren los elementos nuevos
- [ ] Sin llamadas de red nuevas, y el código sigue en el chunk diferido
- [ ] Textos nuevos en es y en, con `locales.test.ts` en verde
- [ ] README con la animación actualizada y un ADR 0006 con las decisiones

## Decisiones de diseño

Lo que sale del código actual (`src/components/AgentsOffice/`):

- **Lector de planes como el de agentes.** `plans.ts` con `import.meta.glob('../../../docs/plans/*.md', { query: '?raw', import: 'default', eager: true })`. Un parser puro (`parsePlan`) extrae: título (`# Plan: … (#N)`), URL de la issue (`- **Issue:** <url>`) y las tareas (`### Tarea N: título`, hecha si su bloque contiene `- [x] Hecho`). El "último plan" es el de **número de issue más alto**, comparado como número (9 < 10), tomado del prefijo del nombre del fichero (`24-…`). Los planes sin número (los de `/plan-tdd`) se ignoran, porque la issue define "el último" por número de issue.
- **Estado derivado y puro.** `deriveMode(plan)`: `resting` solo si hay tareas y **todas** están hechas; con tareas pendientes, o sin plan, o sin tareas, `working` (el comportamiento de la v1).
- **El descanso cambia la escena, no la quita.** Los escritorios y monitores se quedan; los 5 personajes pasan a sentarse en el sofá con una pose distinta: ojos cerrados y "zZz" o un café. Sin sprites nuevos por personaje: se reutilizan las capas actuales con variantes (`E` más claro para ojos cerrados, más una capa de "zZz" o de taza).
- **Un sofá largo para 5 plazas.** Las zonas táctiles miden 20 unidades (>= 44 px a 360 px) y no pueden solaparse, así que cinco personajes sentados necesitan 100 de los 112 de ancho de la escena. Por eso el sofá es una banqueta larga en una fila nueva al pie, y la escena crece de 72 a unas 92 unidades de alto (todo se posiciona en porcentajes, así que el resto se adapta).
- **La pizarra sustituye al kanban actual**, en el mismo sitio del muro, con una barra de progreso dibujada en píxeles (celdas llenas = tareas hechas). Su zona táctil es más grande que el sprite para llegar a 44 px de alto. Es un séptimo botón, **después de los cinco personajes** en el orden de tabulación, con nombre accesible "Pizarra del plan: 12 de 13 tareas hechas".
- **Ficha del plan.** `PlanCard` con título, enlace a la issue (`rel="noopener noreferrer"`), barra con `role="progressbar"` y `aria-valuenow/max`, y la lista de tareas con texto "Hecha / Pendiente" (nunca solo color). Estado vacío si no hay planes. La seleccion pasa de `AgentId | null` a `AgentId | 'board' | null`.
- **Textos en español dentro de la versión en inglés.** Los títulos de tareas vienen de los planes, escritos en español. Se muestran tal cual con `lang="es"` (para que el lector de pantalla los pronuncie bien) y una nota en la ficha en inglés.
- **Conmutador manual** (decidido: manda el plan y el visitante puede forzar el otro modo): un botón con `aria-pressed` bajo la escena para forzar trabajo o descanso; por defecto manda el plan.
- **Peso.** `eager` incluye el texto de todos los planes en el chunk diferido (hoy unos 48 KB sin comprimir). Es aceptable ahora; si crece, se cambia el origen por un módulo virtual de Vite que entregue solo el último plan, sin tocar el parser.
- **El README no se queda atrás.** `officeSvg.ts` dibuja la misma escena, así que debe adoptar el nuevo tamaño, la pizarra y el sofá; el test de sincronización obliga a regenerar `docs/images/agents-office.svg`.

Alternativas descartadas: leer los planes por red (la issue lo deja para el nivel 2), un sofá de 3 plazas con el resto de pie (rompe la regla de zonas táctiles sin solape o deja a dos personajes sueltos) y una pizarra nueva además del kanban (más elementos en una escena que ya es pequeña en móvil).

## Tareas

Cada tarea: 5-10 min, con su test; el proyecto compila y los tests pasan tras cada una.

### Tarea 1: Lector de planes

- **Ficheros:** `src/components/AgentsOffice/plans.ts`, `src/components/AgentsOffice/plans.test.ts`
- **Test (red):** `parsePlan` extrae título, URL de la issue y tareas con su estado; plan sin tareas, con ninguna marcada y con todas marcadas; ignora `[ ]`/`[x]` que no sean la línea `Hecho` de una tarea; devuelve `null` si no hay título. `latestPlan` elige por número de issue numérico (`9` < `10`) e ignora ficheros sin prefijo numérico; con una lista vacía devuelve `null`. `progress(plan)` da `{ done, total }`. `loadPlans()` devuelve los planes reales (al menos el #10, el #11 y el #18, con tareas).
- **Implementación (green):** parser puro y `import.meta.glob`.
- **Commit:** `feat(agents-office): read the repository plans at build time` + `Refs #24`
- [x] Hecho

### Tarea 2: Estado de la oficina derivado del plan

- **Ficheros:** `src/components/AgentsOffice/officeMode.ts`, `src/components/AgentsOffice/officeMode.test.ts`
- **Test (red):** `deriveMode`: todas las tareas hechas → `resting`; alguna pendiente → `working`; sin tareas → `working`; sin plan (`null`) → `working`. `resolveMode(derived, override)`: sin override manda lo derivado; con override gana el visitante.
- **Implementación (green):** dos funciones puras.
- **Commit:** `feat(agents-office): derive the office mode from the latest plan` + `Refs #24`
- [x] Hecho

### Tarea 3: Sprites de descanso, sofá y pizarra con progreso

- **Ficheros:** `src/components/AgentsOffice/sprites.ts`, `src/components/AgentsOffice/sprites.test.ts`
- **Test (red):** `restingLayers(id)` devuelve capas con filas del mismo ancho, solo letras de su paleta y **distintas** de `characterLayers(id)` (ojos cerrados); existen `DECOR.sofa`, el sprite de "zZz" y el de la taza; `boardSprite(done, total)` pinta tantas celdas llenas como correspondan (0/13, 12/13, 13/13, y `total` 0 sin celdas llenas) y siempre tiene el mismo tamaño.
- **Implementación (green):** variantes de los sprites existentes, sofá largo y generador de la pizarra.
- **Commit:** `feat(agents-office): add resting poses, sofa and progress board sprites` + `Refs #24`
- [x] Hecho

### Tarea 4: Colocación de los elementos nuevos

- **Ficheros:** `src/components/AgentsOffice/layout.ts`, `src/components/AgentsOffice/OfficeScene.test.tsx`
- **Test (red):** en los dos modos, las 5 zonas de personajes y la de la pizarra están dentro de la escena, miden >= 44 px a 360 px, **no se solapan** entre sí y el sofá no tapa ninguna cabeza; los bocadillos siguen sin tapar cabezas ni salirse. Los tests de colocación existentes se parametrizan por modo.
- **Implementación (green):** `SCENE_SIZE` más alto, `REST_STATIONS`, `SOFA` y `BOARD_HIT`, y las constantes de modo.
- **Commit:** `feat(agents-office): lay out the sofa, the board and the resting seats` + `Refs #24`
- [x] Hecho

### Tarea 5: La escena dibuja pizarra, sofá y descanso

- **Ficheros:** `src/components/AgentsOffice/OfficeScene.tsx`, `src/components/AgentsOffice/OfficeScene.test.tsx`
- **Test (red):** con `mode="resting"` cada personaje está en su plaza del sofá (con "zZz" o café) y no en su mesa, y los escritorios siguen dibujados; con `working` se ve como la v1; la pizarra es un botón con nombre accesible que incluye el progreso y llama a `onSelect('board')`; el botón de la pizarra va **después** de los cinco personajes en el orden de tabulación; `aria-pressed` solo en el seleccionado.
- **Implementación (green):** props `mode` y `plan`, `buildArt` por modo, y el botón de la pizarra.
- **Commit:** `feat(agents-office): draw the board and the sofa, and rest the team` + `Refs #24`
- [x] Hecho

### Tarea 6: Animaciones del descanso

- **Ficheros:** `src/styles/globals.css`, `src/components/AgentsOffice/animations.test.ts`
- **Test (red):** existe una animación `@keyframes office-zzz` por pasos (`steps(1, end)`) y otra de respiración lenta para los que descansan; ambas se desactivan en `prefers-reduced-motion`, con el mismo selector que las anima (la lección de la v1).
- **Implementación (green):** CSS y las clases en `OfficeScene`.
- **Commit:** `feat(agents-office): animate the sleeping team in pixel steps` + `Refs #24`
- [x] Hecho

### Tarea 7: Ficha del plan

- **Ficheros:** `src/components/AgentsOffice/PlanCard.tsx`, `src/components/AgentsOffice/PlanCard.test.tsx`, `src/locales/es.json`, `src/locales/en.json`
- **Test (red):** muestra título, enlace a la issue con `rel="noopener noreferrer"`, una barra con `role="progressbar"` (`aria-valuenow`, `aria-valuemax`, nombre accesible) y todas las tareas con "Hecha" o "Pendiente" en texto; las tareas llevan `lang="es"`; en inglés aparece la nota de que los planes están en español; el estado vacío sale sin planes; un plan con 13/13 muestra la barra completa. Las claves nuevas existen en es y en.
- **Implementación (green):** componente y claves `agentsOffice.plan.*`.
- **Commit:** `feat(agents-office): show the latest plan and its progress in a card` + `Refs #24`
- [ ] Hecho

### Tarea 8: Integración en el modal y conmutador

- **Ficheros:** `src/components/AgentsOffice/AgentsOfficeModal.tsx`, `src/components/AgentsOffice/AgentsOfficeModal.test.tsx`, `src/components/AgentsOffice/AgentCard.tsx`, `src/locales/es.json`, `src/locales/en.json`
- **Test (red):** al abrir, el modo sale del plan inyectado (completo → descansan; pendiente → trabajan); tocar la pizarra abre la ficha del plan en lugar de la de un agente; el conmutador (`aria-pressed`) fuerza el otro modo y otra vez lo devuelve al derivado, y su nombre accesible dice qué hará; con `prefers-reduced-motion` no rota el foco; Tab recorre personajes, pizarra y conmutador sin salir del modal; los bocadillos del descanso usan las frases de descanso de cada agente.
- **Implementación (green):** `OfficeBody` lee el último plan, mantiene `selection` y `override`, y las claves `agentsOffice.mode.*` y `agentsOffice.agents.*.resting`.
- **Commit:** `feat(agents-office): wire the plan board and the rest toggle into the modal` + `Refs #24`
- [ ] Hecho

### Tarea 9: Contraste de lo nuevo

- **Ficheros:** `src/components/AgentsOffice/a11y-contrast.test.tsx`, `src/styles/globals.css` (solo si un test falla)
- **Test (red):** en tema claro y oscuro, el texto de la ficha del plan >= 4,5:1; el relleno y el fondo de la barra de progreso >= 3:1 entre sí y contra su tarjeta; el color de las celdas llenas de la pizarra >= 3:1 contra el muro; el anillo de la pizarra seleccionada usa `FOCUS_RING`.
- **Implementación (green):** ajustar solo los colores que fallen, midiendo con los valores reales de `globals.css`.
- **Commit:** `test(agents-office): measure the contrast of the board and the plan card` + `Refs #24`
- [ ] Hecho

### Tarea 10: La animación del README sigue a la escena

- **Ficheros:** `src/components/AgentsOffice/officeSvg.ts`, `src/components/AgentsOffice/officeSvg.test.ts`, `docs/images/agents-office.svg`, `docs/images/agents-office-mobile.png` y `agents-office-desktop.png` (se borran), `README.md`, `README.es.md`
- **Test (red):** el SVG usa el nuevo tamaño de escena, dibuja la pizarra con el progreso del último plan y el sofá, y sigue siendo XML válido, sin recursos externos; el test de sincronización falla hasta regenerar con `npm run docs:office`. Los tests de `scripts/readme.test.mjs` siguen en verde.
- **Implementación (green):** `renderOfficeSvg` reutiliza el layout y los sprites nuevos; una frase en los dos README sobre la pizarra y el descanso. Se retiran las capturas PNG de la v1 (`docs/images/agents-office-mobile.png` y `agents-office-desktop.png`), que el README ya no usa.
- **Commit:** `docs(agents-office): update the readme animation with the board and the sofa` + `Refs #24`
- [ ] Hecho

### Tarea 11: ADR 0006 y verificación visual

- **Ficheros:** `docs/decisions/0006-oficina-de-agentes-v2.md`, `docs/decisions/README.md`
- **Contenido:** el ADR recoge las decisiones de este plan (derivación del estado, sofá largo, pizarra que sustituye al kanban, tareas en español, peso del `glob` y su salida) y los resultados de la verificación. Capturas de la web real en 360 px y en escritorio, en los dos modos y en los dos temas, con Chrome automatizado, para detectar lo que los tests no ven (la lección de la v1).
- **Commit:** `docs(agents-office): add ADR 0006 for the office v2` + `Refs #24`
- [ ] Hecho

## Riesgos y verificación

- Comandos: `npm run lint && npm run typecheck && npm run test && npm run build && npm run check:bundle`.
- Verificación manual (la hace una persona en la preview): en es y en, claro y oscuro, móvil de 360 px y escritorio: la pizarra se ve y abre el plan correcto; el conmutador cambia entre trabajo y descanso; ningún personaje queda tapado; el teclado recorre todo; el foco vuelve al botón del Hero al cerrar.
- **Riesgo: la escena más alta** empuja el panel de la ficha hacia abajo en móvil. Mitigación: la v1 ya lleva la ficha a la vista al seleccionar; se comprueba en las capturas.
- **Riesgo: el plan #24 es "el último plan"** mientras se trabaja en él, así que la pizarra mostrará su propio progreso. Es el comportamiento pedido y sirve de prueba real.
- **Riesgo: `eager` y el peso del chunk.** Se mide con `npm run build` antes y después; si el chunk diferido crece de forma notable, se pasa al módulo virtual (ver decisiones).
- **Riesgo: tests de colocación** de la v1 asumen una escena de 72 de alto y 5 estaciones; se adaptan en la tarea 4 y deben seguir probando las mismas reglas.
- Fuera de alcance: GitHub como fuente (nivel 2), estado en tiempo real (nivel 3) y el botón "Ejecutar pipeline".

## Preguntas abiertas

Ninguna. Decididas con el autor, todas con la propuesta del plan:

1. **Todos los planes completos:** manda el plan (descanso) y un conmutador manual visible deja ver al equipo trabajando.
2. **Tareas en español en la versión en inglés:** se muestran tal cual, con `lang="es"` y una nota.
3. **Pizarra:** sustituye al kanban actual, en el mismo sitio y con el progreso dibujado.
4. **Capturas PNG de la v1:** se retiran (`docs/images/agents-office-mobile.png` y `agents-office-desktop.png`), en la tarea 10.
