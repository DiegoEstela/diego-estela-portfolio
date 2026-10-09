---
name: new-feature
description: Lee una issue de GitHub, crea la rama de trabajo, escribe un plan de implementación en docs/plans y lo publica como comentario en la issue tras confirmación. Úsala al empezar una issue.
argument-hint: "<nº de issue>"
---

# new-feature

Convierte una issue en una rama y un plan accionable. **No escribe código de producto.**

## Reglas comunes

- Documentación, plan y mensajes al usuario en **español**; código, tests y commits en **inglés**.
- Nunca hagas acciones externas (push, PR, cierre de issues) sin petición. La única excepción es publicar el plan en la issue, y solo tras confirmación.
- Usa siempre el repo del directorio actual (sin owner/repo fijo).

## Pasos

1. **Precondición:** ejecuta `gh auth status`. Si falla, pide al usuario `! gh auth login`.
2. **Leer la issue:** `gh issue view $ARGUMENTS --json number,title,body,author,labels,state,url,comments`. Lee también los comentarios. Si está `CLOSED`, avisa y pregunta si continuar.
3. **Tipo y rama:** deduce el tipo por etiqueta (`bug` → `fix`, `feature` → `feat`; otro → pregunta). Crea `<tipo>/<numero>-<descripcion-kebab>` desde `main`:
   `git switch -c <rama> main` (si hay cambios sin commitear, detente y avisa).
4. **Explorar el código:** usa Read/Grep/Glob. No cites ficheros o funciones sin comprobar que existen. Las áreas son `web`, `content`, `chatbot` e `infra` (ver CLAUDE.md).
5. **Escribir el plan** en `docs/plans/<numero>-<tipo>-<descripcion>.md` usando [assets/TEMPLATE.md](assets/TEMPLATE.md):
   - Cada tarea se hace en 5-10 minutos e incluye su test y los ficheros que toca.
   - Orden tal que el proyecto compile y los tests pasen tras cada tarea.
   - Lo ambiguo va a "Preguntas abiertas".
6. **Confirmar:** muestra el plan al usuario y espera su OK (usa `AskUserQuestion`).
7. **Publicar:** `gh issue comment <n> --body-file docs/plans/<fichero>.md`.
8. **Cerrar:** resume rama, plan y siguiente paso (`/implement-issue <n>`). No hagas commit, push ni cierres la issue.
