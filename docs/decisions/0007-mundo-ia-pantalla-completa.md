# 0007. «Mi mundo IA»: una pantalla completa en lugar de un modal

- **Estado:** Aceptada
- **Área:** web, content
- **Relación:** sustituye la forma (no el contenido) del modal de los ADR [0005](0005-oficina-de-agentes-pixel-art-con-codigo.md) y [0006](0006-oficina-de-agentes-v2.md): la oficina pixel art sigue igual, pero ahora es una sección más.

## Contexto

El botón del Hero abría un modal con la oficina de agentes. Ahora la sección tiene más que enseñar: los proyectos con IA (con su repositorio y su web), las certificaciones y la oficina. Un modal de `max-w-4xl` no aprovecha el espacio, y la idea es que el visitante sienta que entra en otro sitio, no que se abre una ventana.

## Decisión

- **Sigue siendo un diálogo (`role="dialog"`, `aria-modal`), pero ocupa toda la pantalla.** Se conserva todo lo que ya estaba probado: foco que entra y vuelve al botón, Tab atrapado, Escape, bloqueo del scroll de la página y carga diferida del trozo (`AgentsOfficeModal` sigue siendo un chunk aparte). No hay fondo oscuro que pulsar: se sale con el botón «Volver al portfolio» o con Escape.
- **Una paleta propia, blanca y azul, fija en ambos temas.** Se define en `.ai-world` con las mismas variables (`--accent`, `--bg-primary`…) que usa el resto, así los componentes de la oficina no cambian. Es plana, sin degradados, con rejilla de plano técnico, esquinas casi rectas y rótulos en mayúsculas.
- **La pantalla de carga es una máquina** (engranajes, líneas de consola y barra de progreso, 2,2 s). El mundo ya está montado debajo, así que nada espera a la animación; se salta pulsándola y con `prefers-reduced-motion` no se muestra. Es decorativa (`aria-hidden`).
- **Cuatro botones flotantes arriba y al centro**, en lugar de una cabecera: volver, proyectos, certificaciones y cómo trabaja la IA. En un móvil forman una rejilla de 2×2 para no tapar el contenido.
- **El contenido va en los ficheros de idioma y los datos en TypeScript.** `aiProjects.ts` guarda las URLs del repositorio y de la web; `certifications.ts`, las imágenes, el enlace de verificación y el ID. Los textos están en `agentsOffice.world.*` en es y en.
- **Una formación sin diploma no se presenta como completada.** El estado de una certificación se calcula con la fecha: «Completado» si hay certificado; «En curso» hasta el último día de la formación y «Finalizado» después, que no promete un diploma que aún no existe (`certificationStatus`).
- **Los textos de los proyectos no afirman más de lo que hay.** El RAG se presenta como automatizado y medido, no como «agéntico»; sus límites se muestran. Las cifras vienen de la descripción del propio repositorio.

## Alternativas descartadas

- **Una ruta nueva (`/mundo-ia`) con React Router.** Ya está instalado, pero la animación de entrada, el foco que vuelve al botón y el no perder la posición del scroll de la página son más simples y están ya probados en el diálogo.
- **Pestañas dentro del modal.** Esconden el contenido tras un clic y obligan a cambiar los tests de la oficina; una página con secciones y botones de salto enseña todo a un desplazamiento.
- **Hacer el mundo oscuro, como el resto del sitio.** Se quería un contraste claro con el portfolio para que se note que se entra a otro lugar.
- **Degradados, globos de luz y estrellas.** Se probaron y se descartaron: quedaban demasiado ingenuos para el tono técnico que se busca.

## Consecuencias

- El chunk diferido crece (más contenido y dos pantallas de imagen que se cargan perezosamente); sigue sin afectar a la primera carga de la página.
- Hay dos copias de los diplomas si se conservan los originales en `docs/certification/`: la que sirve la web está en `public/certifications/`.
- La fecha de fin de la formación de seguridad está en `certifications.ts`; cuando llegue el diploma hay que añadir su imagen y quitar `endsOn`.
