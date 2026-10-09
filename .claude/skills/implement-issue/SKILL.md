---
name: implement-issue
description: Implementa una issue con TDD estricto a partir del plan publicado en ella, en un git worktree aislado y, si procede, con subagentes en paralelo por área. Úsala tras new-feature o plan-issue.
argument-hint: "<nº de issue>"
---

# implement-issue

Implementa el plan de una issue con ciclos red-green-refactor. **Nunca modifica el árbol de trabajo principal** cuando hay worktree.

## Reglas comunes

- Español para la comunicación; código, tests y commits en inglés.
- Sin acciones externas (push, PR, comentarios, cierre de issues) salvo petición expresa.
- Sin `--no-verify` ni `--amend`.

## Pasos

1. **Precondición:** `gh auth status`.
2. **Leer el plan:** `gh issue view $ARGUMENTS --json number,title,labels,state,url,comments`. Usa el comentario de plan **más reciente**. Si no hay plan, detente y sugiere `/new-feature $ARGUMENTS`.
3. **Worktree:** localiza la rama del plan (o `git branch --list "*/$ARGUMENTS-*"`). Crea
   `git worktree add .claude/worktrees/issue-$ARGUMENTS <rama>` y trabaja allí.
   Ejecuta `npm ci` y comprueba que `npm run lint && npm run test && npm run build` parten en verde. Si no, informa y para.
4. **TDD estricto, tarea a tarea:**
   - **Red:** escribe el test; ejecútalo y confirma que falla *por el motivo correcto*.
   - **Green:** el mínimo código para que pase.
   - **Refactor:** limpia con la suite completa en verde.
   - **Commit** por tarea (Conventional Commits en inglés) con `Refs #<n>` al pie.
   - Marca `[ ]` → `[x]` en el plan.
5. **Paralelismo por áreas:** si el plan toca varias áreas independientes (`web`, `content`, `chatbot`, `infra`):
   - Lanza **un subagente por área en el mismo mensaje** (`general-purpose`, sin `isolation`).
   - Cada uno trabaja en su worktree `.claude/worktrees/issue-$ARGUMENTS-<area>` y rama `<rama>--<area>`; construye su prompt desde [assets/AGENT_PROMPT.md](assets/AGENT_PROMPT.md).
   - Integra con `git merge --no-ff <rama>--<area>`, ejecuta la suite tras cada merge y elimina los worktrees de los agentes (`git worktree remove`).
   - Si las áreas se solapan en ficheros, no paralelices.
6. **Cierre:** resumen de tareas hechas, tests y estado de la suite. **No** hagas push, PR ni comentes en la issue. Ofrece al usuario:
   - `git push -u origin <rama>`
   - `gh pr create --draft --body "Closes #<n>"`
