# 0006. La oficina de agentes v2: la pizarra del plan y el sofá de descanso

- **Estado:** Aceptada
- **Área:** web, content
- **Origen:** issue #24
- **Relación:** amplía el [ADR 0005](0005-oficina-de-agentes-pixel-art-con-codigo.md); solo cambia el tamaño de la escena (de 112×72 a 112×88 unidades).

## Contexto

La oficina de la v1 enseña *quiénes* son los agentes. La v2 enseña *qué está pasando en el repositorio*: una **pizarra** que muestra el último plan de `docs/plans/` con su progreso real, y un **sofá** al que el equipo se va a descansar cuando el plan está terminado. Todo se calcula al compilar, sin llamadas de red (la actividad en vivo queda para issues futuras).

## Decisión

- **El estado se deriva del último plan y el visitante puede cambiarlo.** `deriveMode(plan)` devuelve `resting` solo si el plan tiene tareas y **todas** están hechas; con una pendiente, sin tareas o sin plan, `working` (el comportamiento de la v1). Un botón (`aria-pressed`) fuerza el otro modo y, al pulsarlo de nuevo, devuelve el mando al plan. Una línea de estado dice de dónde viene lo que se ve ("según el último plan" o "elegido por ti"). Así la escena es fiel al repositorio sin quedarse dormida para siempre ante un visitante curioso, que es lo que pasaría con la regla pura, porque casi siempre el último plan está terminado.
- **El "último plan" es el de número de issue más alto**, comparado como número (9 < 10) y tomado del prefijo del nombre del fichero. Los planes sin número (los de `/plan-tdd`) se ignoran.
- **Una banqueta larga para cinco plazas.** Las zonas táctiles miden 20 unidades (≥ 44 px en un móvil de 360 px) y no pueden solaparse; cinco personajes sentados necesitan 100 de las 112 unidades de ancho, así que el sofá es una banqueta en una fila nueva al pie y la escena crece a 88 de alto. Los escritorios se quedan, vacíos, y los personajes se sientan con una pose distinta: tres duermen (ojos cerrados y "zZz") y dos toman un café. El asiento se dibuja *delante* de los personajes para ocultar sus piernas, y el respaldo, detrás.
- **La pizarra sustituye al kanban decorativo**, en el mismo sitio. Es un séptimo botón, después de los cinco personajes en el orden de tabulación, y su nombre accesible lleva el progreso ("Pizarra del plan: 7 de 13 tareas hechas"). La barra se dibuja en píxeles y **nunca se llena del todo hasta que están todas las tareas** (12 de 13 son 13 celdas, no 14).
- **Las tareas se muestran en español también en la versión inglesa.** Los planes se escriben en español (regla del repositorio). La ficha marca los títulos con `lang="es"`, para que un lector de pantalla los pronuncie bien, y en inglés añade una nota. El estado ("Hecha", "Pendiente") va en texto y en forma de icono, nunca solo en color.
- **Al cliente solo llega el último plan, ya analizado.** Un plugin de Vite (`vite-plugins/latestPlan.ts`) sirve `virtual:latest-plan` con `{ issue, title, issueUrl, tasks }`. El parser (`planParser.ts`) es puro y no usa `import.meta.glob`, para poder ejecutarse también en Node.
- **La animación del README es un bucle determinista** (24 s): el equipo trabaja 18 s mientras la barra de la pizarra se llena de pixel en pixel, y después descansa 6 s. No depende del progreso real del plan, porque entonces el SVG versionado cambiaría con cada tarea marcada y su test de sincronización fallaría constantemente.
- **El modal recibe el plan como propiedad.** Por defecto usa el real; los tests inyectan uno fijo, porque el progreso del plan real cambia con cada commit y haría los tests dependientes del día.

## Alternativas descartadas

- **`import.meta.glob` sobre `docs/plans/*.md`** (la primera versión, y lo que sugería la issue por analogía con `.claude/agents/`). Lo medí: el chunk diferido pasó de 18,3 kB a **92,6 kB** (7,3 → 31,0 kB comprimido) porque el texto completo de todos los planes viajaba al navegador. Además la guardia de secretos del build falló: el plan #10 cita en su prosa el bug que arregló (`VITE_ANTHROPIC…`). Con el módulo virtual el chunk es de **27,9 kB** (9,9 kB comprimido).
- **Derivar el descanso solo del plan, sin conmutador.** Fiel, pero la escena estaría casi siempre en descanso.
- **Un sofá de tres plazas con el resto de pie.** Rompe la regla de zonas táctiles sin solape o deja a dos personajes sueltos.
- **Una pizarra nueva además del kanban.** Más elementos que colocar sin solapes en una escena ya pequeña en un móvil.
- **Un SVG del README con el progreso real del plan.** Habría que regenerarlo con cada tarea marcada.

## Consecuencias

- El estado de la escena es el del **último despliegue**, no el de este instante. La actividad en vivo (GitHub o los hooks de Claude Code) queda para los niveles 2 y 3 de la issue.
- Un plan que no siga la plantilla de `/new-feature` (`### Tarea N:` y `- [x] Hecho`) no tiene tareas y no puede dejar a nadie descansando: falla hacia el lado seguro (trabajando).
- Los bocadillos de los personajes de la fila de arriba pueden tapar la pizarra mientras hablan (el bocadillo no intercepta el toque, así que sigue siendo pulsable).
- La ficha de un agente sigue describiendo lo que hace en su mesa aunque el equipo esté descansando: es su definición (el rol, las herramientas y lo que hace cuando trabaja), no su estado del momento. Solo los bocadillos de la escena cambian con el modo.
- El parser ignora los bloques de código, acepta variantes del encabezado de tarea (`### Tarea 3 - X`) y solo conserva enlaces a GitHub por https: los planes son texto libre y el enlace acaba en un `href`.
- Cada cambio de personajes o de textos exige `npm run docs:office`; un test lo recuerda comparando el SVG con el generador.

## Verificación

Además de los tests de colocación (zonas táctiles de al menos 44 px que no se solapan en ningún modo, el sofá sin cubrir cabezas), de contraste (3:1 para anillos y barras, 4,5:1 para texto, en los dos temas) y de animación (`prefers-reduced-motion`), se probó la web real con un Chrome automatizado en 360 px y en escritorio, en los dos modos y en los dos temas. Las capturas, que ningún test sustituye, llevaron a ajustar tres cosas: la "zZz" de 3×3 se leía como una "I" (ahora mide 3×5), la taza era un borrón blanco y el asiento tapaba el torso, de modo que los personajes parecían cabezas asomando. La medición de contraste, por su parte, obligó a oscurecer dos colores del sofá que no daban el 3:1 que necesita el anillo de selección.
