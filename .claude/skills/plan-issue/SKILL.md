---
name: plan-issue
description: Solo planifica una issue de GitHub (sin tocar código ni ramas) y publica el plan como comentario. Úsala cuando quieras el plan sin crear la rama.
argument-hint: "<nº de issue>"
allowed-tools: Bash(gh issue view:*), Bash(gh issue comment:*), Bash(gh repo view:*), Bash(gh auth status:*), Bash(git rev-parse:*), Read, Grep, Glob, Write
---

# plan-issue

Planificación pura: **nunca modifica código, ramas ni el árbol de trabajo** (solo escribe el fichero temporal del plan).

## Pasos

1. `gh auth status` como comprobación previa.
2. `gh issue view $ARGUMENTS --json number,title,body,labels,state,url,comments` y lee los comentarios. Si está cerrada, avisa y pregunta.
3. Explora el código con Read/Grep/Glob. **No inventes** ficheros ni funciones: comprueba cada ruta o símbolo que cites.
4. Redacta el plan siguiendo [plantilla-plan.md](plantilla-plan.md) en un fichero temporal dentro del directorio scratchpad o `docs/plans/`.
5. Incluye la sección **Preguntas abiertas** con todo lo ambiguo.
6. Muestra el plan y espera confirmación del usuario.
7. Publícalo con `gh issue comment <n> --body-file <fichero>`. **Nunca** interpoles el contenido en la línea de comandos.
8. Sugiere `/implement-issue <n>` como siguiente paso.

Documentación en español; nombres de código en inglés.
