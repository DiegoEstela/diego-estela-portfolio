# 0005. La oficina de agentes: pixel art dibujado con código

- **Estado:** Aceptada
- **Área:** web, content
- **Origen:** issue #18

## Contexto

El portfolio cuenta que se desarrolla con agentes de IA, y la forma más honesta de demostrarlo es **enseñar los agentes reales del repositorio**, no una ilustración genérica. Requisitos: sin coste (ni generadores de imágenes ni servicios de pago), entretenido, usable en un móvil de 360 px y accesible.

## Decisión

Un botón en el Hero ("¿Cómo trabaja la IA por mí?") abre un modal con una oficina pixel art vista desde arriba, con cinco personajes: el orquestador (Claude) y los cuatro agentes de `.claude/agents/`.

- **El pixel art es código, no imágenes.** Cada sprite es una cuadrícula de letras con una paleta (`sprites.ts`); `spriteToRects` la convierte en rectángulos SVG agrupando píxeles contiguos del mismo color. Pesa unos pocos KB, escala sin pérdida (`shape-rendering="crispEdges"`), es original (sin licencias) y se puede animar con CSS.
- **Los personajes son botones HTML sobre el dibujo**, posicionados en porcentajes. El teclado, los lectores de pantalla y el toque funcionan de serie, con zonas de ~58×69 px en un móvil de 360 px (mínimo recomendado: 44).
- **Los datos de las fichas salen de los ficheros reales.** `import.meta.glob` lee `.claude/agents/*.md` al compilar; de cada uno se muestran el nombre, las herramientas y el modelo. "Solo lectura" o "Puede editar" se **deriva** de las herramientas, no se escribe a mano. El texto "qué hace" va en `es.json` y `en.json`.
- **Carga diferida.** El modal es un chunk aparte (~18 kB, ~7 kB comprimido) que se descarga al pasar el ratón o enfocar el botón, no en la carga inicial. Una vez abierto se mantiene montado para animar el cierre.
- **Un solo bocadillo a la vez.** Un foco rota entre los personajes cada 3,5 s; en una pantalla pequeña varios bocadillos se pisarían. Un personaje elegido conserva el foco. Con `prefers-reduced-motion` no hay rotación ni animaciones, y la escena sigue siendo plenamente usable.
- **Escena compacta (112×72 unidades).** Menos unidades a lo ancho hacen cada personaje mayor en un móvil: se redujo desde 160×100 tras verlo en una captura real.
- **Modal accesible a mano:** `role="dialog"`, `aria-modal`, Escape, foco que entra y vuelve al botón, trampa de Tab, scroll de la página bloqueado, y se pinta en `document.body` mediante un portal, porque un ancestro con `transform` (los botones del Hero lo tienen) rompería `position: fixed`.

## Alternativas descartadas

- **`<canvas>`:** peor para accesibilidad y para escalar sin pérdida; habría que reimplementar la interacción y el foco.
- **Imágenes PNG o generadas:** peso, licencias, y no se adaptan al tema ni se animan por partes.
- **Una librería de modales:** una dependencia nueva para unas 100 líneas que además controlamos.
- **Una sección fija en la página** (planteamiento original de la issue): ocupa espacio y se descubre menos que un botón en el primer pantallazo.

## Consecuencias

- La web **nunca** muestra herramientas o modelos distintos de los del repositorio. Un test falla si se añade un agente sin personaje ni textos, lo que obliga a mantenerlos al día.
- El bundle público incluye los nombres, herramientas y modelos de los agentes. Es información que ya es pública en el repositorio.
- **La parte visual no se puede verificar con tests.** Se comprobó con un Chrome automatizado (móvil de 360 px y escritorio de 1280 px), con capturas de la web real, y queda para la preview. Las capturas del README salen de ahí.
- **Contraste medido, no supuesto.** La auditoría de `web-quality-auditor` encontró tres fallos reales que ningún test de comportamiento veía: la insignia "Orquestador" (blanco sobre el acento, 2,9:1 en oscuro), el texto del botón del Hero sobre su degradado (3,7:1) y el anillo de foco de los personajes en tema claro (1,7:1, porque la escena es siempre oscura). Se corrigieron y `a11y-contrast.test.tsx` calcula la razón de contraste con los valores reales de `:root` y `.light` de `globals.css`, así que un cambio de paleta que rompa el mínimo falla en CI.
- **Los bocadillos no tapan a nadie.** El de la fila superior descansa sobre la pared; el de la inferior, sobre los escritorios de la fila de arriba. Un test comprueba que ningún bocadillo cubre la cabeza de otro personaje.
- Deuda conocida: con el modal abierto el resto de la página no es `inert` (la trampa de Tab cubre el teclado; el cursor virtual de un lector de pantalla podría salir del diálogo), y el botón principal "Ver proyectos" del Hero ya usaba texto blanco sobre el acento (2,9:1 en oscuro) antes de este cambio.
- Observación al margen: la actualización de Vite del PR #20 reagrupó los chunks (el bundle principal pasó de ~298 kB a ~447 kB, absorbiendo el chunk de `framer-motion` de ~124 kB). Este cambio solo añade ~1,2 kB a la carga inicial. Queda pendiente medir si el peso inicial total cambió.
- Fuera de alcance: el botón "Ejecutar pipeline" con la animación issue → plan → TDD → PR, y tickets reales leídos de la API de GitHub.
