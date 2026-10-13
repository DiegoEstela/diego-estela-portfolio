# Plan: README pensado para reclutamiento, con la oficina de agentes animada

- **Rama:** `docs/readme-for-recruiters` (sin issue)
- **Área:** content (con un módulo pequeño en web)
- **Tipo:** docs

## Contexto

El README actual es correcto pero técnico: un reclutador tiene que leer varias secciones para entender que lo especial de este repositorio es **cómo trabaja la IA en él**. Hoy la oficina de agentes solo aparece como dos capturas estáticas.

Decisiones acordadas con el autor:

- **Idioma:** `README.md` en inglés (principal) y `README.es.md` en español, enlazados entre sí. Es una excepción a la regla de "documentación en español" del CLAUDE.md, que se anota en él.
- **Enfoque "gancho + prueba":** arriba, una frase, la animación y "qué demuestra esto"; después el flujo de IA con sus puntos de control humanos, la plantilla de agentes y evidencias reales; lo técnico (stack, comandos, estructura) más abajo y plegado.
- **Animación:** un SVG animado generado por código a partir de los **sprites reales** (`src/components/AgentsOffice/sprites.ts`, `layout.ts`), guardado en `docs/images/` e incrustado con `<img>`. Sin grabaciones ni dependencias nuevas.

## Criterios de aceptación

- [ ] `README.md` y `README.es.md` se enlazan entre sí y comparten estructura
- [ ] La animación muestra los 5 personajes con idle por pasos y un foco que rota entre ellos, y respeta `prefers-reduced-motion`
- [ ] Una leyenda explica qué representa cada personaje, con modelo y herramientas **leídos de `.claude/agents/`**
- [ ] Evidencias reales y enlazadas (issue #11 / PR #17; PR #20 y #25), sin cifras ni afirmaciones que no se puedan comprobar
- [ ] El SVG del repo no puede quedar desactualizado: un test lo compara con el generador
- [ ] Lint, tipos, tests, build y `check:bundle` en verde

## Decisiones de diseño

- **Un generador puro, `renderOfficeSvg()`**, en `src/components/AgentsOffice/officeSvg.ts`. Reutiliza `characterLayers`, `monitorSprite`, `DECOR`, `STATIONS` y `spriteToRects`, así que **dibuja exactamente lo que ve el usuario en la web** y se entera de cualquier cambio de personajes. Al vivir en `src/` lo comprueban `tsc -b` y ESLint.
- **Sin script ni versión de Node que importe.** El SVG se guarda con `toMatchFileSnapshot('../../../docs/images/agents-office.svg')` de Vitest: el test falla si el fichero no coincide y `npm run docs:office` (`vitest run officeSvg -u`) lo regenera. En CI un snapshot ausente o distinto es un fallo.
- **El SVG es autónomo:** colores fijos (la escena es oscura en ambos temas; el acento es `FOCUS_RING`), sin `var(--accent)`, sin fuentes ni recursos externos. El texto de los bocadillos sale de `src/locales/en.json` (`agentsOffice.agents.*.doing`), no se duplica a mano.
- **Animación por CSS dentro del SVG**, con `steps()` como `office-bob` y `office-glow` de `globals.css`. Un ciclo único recorre los 5 personajes (foco + bocadillo) y `@media (prefers-reduced-motion: reduce)` lo deja estático. GitHub anima SVG dentro de `<img>` y bloquea los scripts, por eso solo CSS.
- **Los tests del README son de contenido, no de estilo:** enlaces cruzados, rutas locales existentes, imagen presente, y que cada agente de `.claude/agents/` aparezca con su modelo en las dos versiones. Así el README no miente sobre el roster.
- **Evidencias solo verificables:** issue #11 y PR #17 (el bug que solo vio una persona), PR #20 y PR #25 (clave sin workspace detectada probando la API; compilación no estricta de Vercel detectada con un test que la reproduce). Sin contar tests ni porcentajes.

## Tareas

### Tarea 1: Generador del SVG animado

- **Ficheros:** `src/components/AgentsOffice/officeSvg.ts`, `src/components/AgentsOffice/officeSvg.test.ts`
- **Test (red):** `renderOfficeSvg(labels)` devuelve un SVG con `viewBox="0 0 112 72"` y `shape-rendering="crispEdges"`; contiene un grupo `data-agent` por cada `AGENT_IDS` con rectángulos de sus sprites reales; incluye `@keyframes` con `steps(`, un bloque `prefers-reduced-motion` y un bocadillo por personaje con el texto recibido; es determinista; no contiene `href`, `url(http`, `<script`, `<foreignObject` ni `var(`; el foco recorre los 5 en orden.
- **Implementación (green):** función pura que reutiliza los sprites y `STATIONS`; texto escapado para XML.
- **Commit:** `feat(agents-office): render the office as a standalone animated svg`
- [x] Hecho

### Tarea 2: SVG versionado y siempre sincronizado

- **Ficheros:** `src/components/AgentsOffice/officeSvg.test.ts`, `docs/images/agents-office.svg`, `package.json`
- **Test (red):** `expect(renderOfficeSvg(labelsFromEnJson)).toMatchFileSnapshot('../../../docs/images/agents-office.svg')` falla con `CI=true` porque el fichero no existe.
- **Implementación (green):** generar el fichero con `npm run docs:office`; el script se añade a `package.json`. Comprobar el aspecto renderizándolo en un navegador y ajustar tiempos si hace falta.
- **Commit:** `feat(agents-office): add the generated animated svg and its sync test`
- [x] Hecho

### Tarea 3: Tests de contenido del README

- **Ficheros:** `scripts/readme.test.mjs`
- **Test (red):** `README.md` enlaza `README.es.md` y al revés; toda ruta local de enlaces e imágenes existe; ambos incrustan `docs/images/agents-office.svg`; cada agente de `.claude/agents/*.md` aparece con su `model` en los dos README; ningún README contiene `sk-ant` ni `VITE_ANTHROPIC`. Falla hoy (no existe `README.es.md`).
- **Implementación (green):** el test lee los ficheros reales; la implementación llega en las tareas 4 y 5.
- **Commit:** `test: guard the readmes against broken links and a stale agent roster`
- [ ] Hecho

### Tarea 4: `README.md` en inglés

- **Ficheros:** `README.md`
- **Estructura:** título y una frase · badges · animación · "What this demonstrates" (3 puntos) · cómo trabaja la IA (diagrama del flujo con los puntos de control humanos) · el equipo de agentes (leyenda de personajes, modelo y herramientas) · evidencias reales · `<details>` con stack, comandos, estructura y seguridad del chatbot · contacto.
- **Verificación:** los tests de la tarea 3 pasan en lo que a `README.md` se refiere.
- **Commit:** `docs: rewrite the readme for recruiters, led by how AI works in the repo`
- [ ] Hecho

### Tarea 5: `README.es.md` en español

- **Ficheros:** `README.es.md`
- **Contenido:** misma estructura y mismas evidencias, traducidas con naturalidad; el enlace de idioma arriba. Quedan en verde todos los tests de la tarea 3.
- **Commit:** `docs: add the spanish readme`
- [ ] Hecho

### Tarea 6: Convención documentada

- **Ficheros:** `CLAUDE.md`, `docs/AI-WORKFLOW.md` (solo si enlaza al README)
- **Contenido:** una línea en CLAUDE.md: `README.md` va en inglés y `README.es.md` en español, y `npm run docs:office` regenera la animación al cambiar los personajes.
- **Commit:** `docs: document the bilingual readme and the svg regeneration`
- [ ] Hecho

## Verificación

`npm run lint && npm run typecheck && npm run test && npm run build && npm run check:bundle`. Manual (tuyo): abrir el PR en GitHub y comprobar que la animación se mueve, que se lee bien en móvil y que los enlaces del README funcionan en la rama.

## Riesgos

- **GitHub y los SVG animados:** se animan dentro de `<img>`, pero el visor de ficheros puede mostrarlos estáticos. Se comprueba en el PR.
- **Texto en el SVG:** usa fuentes del sistema; no puede ser pixel font sin incrustarla. Se mantiene corto y legible, o se dibuja como pixeles si queda feo.
- **`toMatchFileSnapshot` en local escribe el fichero si falta:** el rojo se verifica con `CI=true`.
- **CLAUDE.md pide docs en español:** la excepción se aprueba aquí y se anota en la tarea 6.
- Sin push ni PR hasta que lo pidas.
