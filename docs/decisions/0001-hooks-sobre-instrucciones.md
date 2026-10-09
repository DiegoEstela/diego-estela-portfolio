# 0001. Hacer cumplir las reglas con hooks, no solo con instrucciones

- **Estado:** Aceptada
- **Área:** infra

## Contexto

Las reglas del proyecto (no `git add -A`, no `--no-verify`, no tocar `.env*`) estaban solo en `CLAUDE.md` y en las skills. Son instrucciones en lenguaje natural: un modelo puede olvidarlas, malinterpretarlas o ser inducido a ignorarlas por contenido no confiable (por ejemplo, el cuerpo de una issue).

## Decisión

Las reglas críticas se aplican con **hooks deterministas** en `.claude/hooks/`:

- `PreToolUse` (`guard.mjs`) bloquea los comandos y las escrituras que las incumplen.
- `PostToolUse` (`lint-edited.mjs`) ejecuta ESLint sobre los ficheros editados y devuelve los errores al agente.

La lógica vive en `guard-rules.mjs`, un módulo puro con tests (`guard-rules.test.mjs`) que se ejecutan en CI.

## Consecuencias

- Las reglas dejan de depender de la memoria del modelo; un fallo de criterio no llega a ejecutarse.
- Las reglas son código: se versionan, se revisan y se prueban.
- El guard ignora el texto entre comillas y los heredocs para evitar falsos positivos con mensajes de commit. Limitación asumida: `bash -c "git add -A"` no se detecta. El guard evita errores honestos; **no es una frontera de seguridad**. Los permisos de `settings.json` y la protección de rama en GitHub siguen siendo la defensa real.
- Durante el desarrollo del propio guard, un falso positivo bloqueó un commit cuyo mensaje mencionaba `git add -A`; de ahí los tests de texto entre comillas.
