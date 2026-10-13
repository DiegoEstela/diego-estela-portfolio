import { describe, expect, it } from 'vitest'
import { latestPlan, loadPlans, parsePlan, planIssueNumber, progress, type Plan } from './plans'

const PLAN = `# Plan: Corregir algo importante (#12)

- **Issue:** https://github.com/o/r/issues/12
- **Rama:** \`fix/12-algo\`

## Criterios de aceptación

- [ ] Esto no es una tarea
- [x] Ni esto

## Tareas

### Tarea 1: Primera tarea

- **Test (red):** falla
- [x] Hecho

### Tarea 2: Segunda tarea

- [ ] Hecho

### Tarea 3: Tercera tarea

> Añadida tras la revisión.

- [x] Hecho

## Riesgos

- [x] Tampoco esto
`

describe('parsePlan', () => {
  it('reads the title without the "Plan:" prefix and the issue number', () => {
    const plan = parsePlan(PLAN, 12)
    expect(plan?.title).toBe('Corregir algo importante')
    expect(plan?.issue).toBe(12)
  })

  it('reads the link to the issue', () => {
    expect(parsePlan(PLAN, 12)?.issueUrl).toBe('https://github.com/o/r/issues/12')
  })

  it('has no link when the plan does not declare one', () => {
    expect(parsePlan('# Plan: Sin enlace (#3)\n\n### Tarea 1: A\n- [x] Hecho\n', 3)?.issueUrl).toBeNull()
  })

  it('lists the tasks in order with their state', () => {
    expect(parsePlan(PLAN, 12)?.tasks).toEqual([
      { title: 'Primera tarea', done: true },
      { title: 'Segunda tarea', done: false },
      { title: 'Tercera tarea', done: true },
    ])
  })

  it('only counts the "Hecho" line of a task, not other checkboxes of the document', () => {
    const plan = parsePlan(PLAN, 12)!
    expect(progress(plan)).toEqual({ done: 2, total: 3 })
  })

  it('treats a task without a "Hecho" line as pending', () => {
    const plan = parsePlan('# Plan: X (#1)\n\n### Tarea 1: Sin marca\n\nTexto.\n', 1)
    expect(plan?.tasks).toEqual([{ title: 'Sin marca', done: false }])
  })

  it('accepts a plan with no tasks at all', () => {
    const plan = parsePlan('# Plan: Vacío (#2)\n\nNada que hacer.\n', 2)
    expect(plan?.tasks).toEqual([])
    expect(progress(plan!)).toEqual({ done: 0, total: 0 })
  })

  it('accepts a plan whose tasks are all done', () => {
    const plan = parsePlan('# Plan: Listo (#4)\n\n### Tarea 1: A\n- [x] Hecho\n\n### Tarea 2: B\n- [x] Hecho\n', 4)
    expect(progress(plan!)).toEqual({ done: 2, total: 2 })
  })

  it('reads Windows line endings', () => {
    const plan = parsePlan(PLAN.replace(/\n/g, '\r\n'), 12)
    expect(plan?.title).toBe('Corregir algo importante')
    expect(progress(plan!)).toEqual({ done: 2, total: 3 })
  })

  it('returns null without a title', () => {
    expect(parsePlan('Sin título\n\n### Tarea 1: A\n- [x] Hecho\n', 5)).toBeNull()
  })

  it('keeps a title that has no "Plan:" prefix or issue suffix as it is', () => {
    expect(parsePlan('# Algo distinto\n', 6)?.title).toBe('Algo distinto')
  })
})

describe('planIssueNumber', () => {
  it('takes the number from the numeric prefix of the file name', () => {
    expect(planIssueNumber('24-feat-agents-office-v2.md')).toBe(24)
    expect(planIssueNumber('../../../docs/plans/10-fix-protect-anthropic-key.md')).toBe(10)
  })

  it('has no number for plans written without an issue', () => {
    expect(planIssueNumber('readme-for-recruiters.md')).toBeNull()
    expect(planIssueNumber('fix-vercel-function-compile.md')).toBeNull()
  })
})

const plan = (issue: number): Plan => ({ issue, title: `Plan ${issue}`, issueUrl: null, tasks: [] })

describe('latestPlan', () => {
  it('chooses the highest issue number, compared as a number', () => {
    expect(latestPlan([plan(9), plan(10), plan(2)])?.issue).toBe(10)
  })

  it('does not depend on the order of the list', () => {
    expect(latestPlan([plan(18), plan(10), plan(11)])?.issue).toBe(18)
  })

  it('returns null when there are no plans', () => {
    expect(latestPlan([])).toBeNull()
  })
})

describe('loadPlans', () => {
  const plans = loadPlans()

  it('reads the real plans of the repository, written with an issue number', () => {
    const issues = plans.map((p) => p.issue)
    expect(issues).toEqual(expect.arrayContaining([10, 11, 18]))
  })

  it('ignores plans written without an issue number', () => {
    expect(plans.every((p) => Number.isInteger(p.issue))).toBe(true)
    expect(plans.some((p) => /reclutamiento|Avisos de compilación/.test(p.title))).toBe(false)
  })

  it('finds the tasks of those plans, all of them done', () => {
    for (const issue of [10, 11, 18]) {
      const real = plans.find((p) => p.issue === issue)!
      const { done, total } = progress(real)
      expect(total, `plan #${issue}`).toBeGreaterThan(0)
      expect(done, `plan #${issue}`).toBe(total)
    }
  })

  it('knows the link to the issue of a real plan', () => {
    expect(plans.find((p) => p.issue === 18)?.issueUrl).toMatch(/\/issues\/18$/)
  })
})
