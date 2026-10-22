# Política de seguridad / Security policy

**EN —** If you find a security problem in this project, please do not open a public issue. Report it privately through [GitHub's private vulnerability reporting](https://github.com/DiegoEstela/diego-estela-portfolio/security/advisories/new) or by email to die.estela@gmail.com. You will get an answer within a few days. Please give me a reasonable time to fix it before disclosing it.

## Cómo reportar una vulnerabilidad

No abras una issue pública. Escribe por una de estas vías:

1. [Reporte privado de vulnerabilidades de GitHub](https://github.com/DiegoEstela/diego-estela-portfolio/security/advisories/new) (preferida).
2. Correo a die.estela@gmail.com, con el asunto «Seguridad: diego-estela-portfolio».

Incluye qué has encontrado, cómo reproducirlo y qué impacto crees que tiene. Responderé en unos días y te avisaré cuando esté corregido. Te pido un plazo razonable antes de publicar nada.

## Qué está dentro del alcance

- La web desplegada y el código de este repositorio.
- El endpoint del chatbot (`/api/chat`): inyección de prompt que revele las instrucciones del sistema, abuso del endpoint, fuga de la clave de la API o de datos del servidor.
- Secretos expuestos en el código o en el historial de git.

## Qué queda fuera

- Ataques de denegación de servicio volumétricos y pruebas automáticas masivas contra la web o el chatbot.
- Ingeniería social contra el autor.
- Vulnerabilidades en dependencias de terceros sin una vía de explotación concreta en este proyecto (las gestiona Dependabot).
- Hallazgos de herramientas automáticas sin una prueba de impacto.

## Cómo se protege el proyecto

- La clave de la API del chatbot vive solo en el servidor; el CI comprueba que no llegue al bundle público.
- El endpoint valida la entrada, limita el tamaño y la frecuencia de las peticiones y rechaza peticiones de otros sitios.
- El sitio envía una política de seguridad de contenido (CSP) y el resto de cabeceras de seguridad (véase `vercel.json`).
- GitHub escanea secretos y bloquea los push que los contengan; Dependabot mantiene las dependencias y las acciones de CI al día.
