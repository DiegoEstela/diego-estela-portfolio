# 0003. Agentes secuenciales por defecto, paralelismo solo con justificación

- **Estado:** Aceptada
- **Área:** infra

## Contexto

`implement-issue` puede repartir áreas independientes entre subagentes en paralelo, cada uno en su worktree. Es potente, pero añade coste, complejidad de integración (`merge --no-ff`) y más superficie de error. El proyecto es pequeño y la mayoría de las issues tocan una sola área.

## Decisión

Por defecto el trabajo es **secuencial** y de un solo agente. El paralelismo se usa solo si el plan lo justifica claramente y la persona lo aprueba. Los agentes revisores (`code-reviewer`, `security-auditor`) se invocan **uno tras otro** antes de abrir el PR.

## Consecuencias

- Menos coste y menos fallos de integración.
- Cada cambio es más fácil de seguir y revisar.
- El mecanismo de paralelismo sigue disponible y documentado en la skill para cuando una issue lo justifique.
