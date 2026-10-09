---
description: Crea un commit siguiendo Conventional Commits 1.0.0 (sin push)
argument-hint: "[nota opcional sobre el cambio]"
allowed-tools: Bash(git status:*), Bash(git diff:*), Bash(git log:*), Bash(git add:*), Bash(git commit:*), Bash(git branch:*)
---

# Contexto actual

- Rama: !`git branch --show-current`
- Estado: !`git status --short`
- Diff en stage: !`git diff --cached`
- Diff sin stage: !`git diff`
- Últimos commits: !`git log --oneline -10`

Nota del usuario (opcional): $ARGUMENTS

# Tarea

Crea un commit con los cambios actuales siguiendo **Conventional Commits 1.0.0**.

## Formato

```
<tipo>(<scope>): <descripción>

[cuerpo opcional: el porqué, no el qué]
```

- **Tipos:** `feat`, `fix`, `docs`, `style`, `refactor`, `perf`, `test`, `build`, `ci`, `chore`, `revert`.
- **Scopes del proyecto:** `hero`, `about`, `projects`, `experience`, `education`, `clients`, `recommendations`, `contact`, `navbar`, `chatbot`, `theme`, `i18n`, `content`, `a11y`, `seo`, `deps`, `ci`, `claude`, `docs`. Omite el scope si no encaja.
- Mensaje **en inglés**: imperativo, minúscula inicial, sin punto final, máximo ~72 caracteres.
- Si hay una issue, añade `Refs #<n>` al pie.

## Reglas de seguridad

- **Nunca** `git add -A` ni `git add .`: añade los ficheros por nombre.
- **Nunca** añadas `.env*`, `*.local`, `node_modules`, `dist` ni ficheros con secretos.
- Si los cambios mezclan temas, propón dividirlos en varios commits y haz uno por tema.
- **Prohibido** `--amend`, `--no-verify` y `git push`.

## Flujo

1. Analiza el contexto de arriba y decide qué ficheros entran en el commit.
2. Redacta el mensaje.
3. Pregunta con `AskUserQuestion` si el usuario está de acuerdo (opciones: confirmar, editar, dividir).
4. Haz `git add <ficheros>` y el commit con HEREDOC:

```bash
git commit -m "$(cat <<'EOF'
feat(scope): descripción

Co-Authored-By: Claude Sonnet 5.5 <noreply@anthropic.com>
EOF
)"
```

5. Muestra el resultado con `git status`. No hagas push.
