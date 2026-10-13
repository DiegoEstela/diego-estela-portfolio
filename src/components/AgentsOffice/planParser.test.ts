import { describe, expect, it } from 'vitest'
import { latestPlan, parsePlan, planIssueNumber, progress, type Plan } from './planParser'

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

describe('parsePlan with code blocks', () => {
  const fence = '```'

  it('does not let a shell comment inside a code block close the task it belongs to', () => {
    const plan = parsePlan(`# Plan: X (#1)

### Tarea 1: Con código

${fence}bash
# instalar
npm ci
${fence}

- [x] Hecho
`, 1)
    expect(plan?.tasks).toEqual([{ title: 'Con código', done: true }])
  })

  it('does not count a task heading that is only an example inside a code block', () => {
    const plan = parsePlan(`# Plan: X (#1)

${fence}md
### Tarea 9: De ejemplo
- [x] Hecho
${fence}

### Tarea 1: Real
- [ ] Hecho
`, 1)
    expect(plan?.tasks).toEqual([{ title: 'Real', done: false }])
  })

  it('does not take the title from a comment inside a code block', () => {
    const plan = parsePlan(`${fence}bash
# no soy el título
${fence}

# Plan: El de verdad (#2)
`, 2)
    expect(plan?.title).toBe('El de verdad')
  })

  it('does not take the link of the issue from an example inside a code block', () => {
    const plan = parsePlan(`# Plan: X (#3)

${fence}md
- **Issue:** https://github.com/o/r/issues/99
${fence}

- **Issue:** https://github.com/o/r/issues/3
`, 3)
    expect(plan?.issueUrl).toBe('https://github.com/o/r/issues/3')
  })

  it('understands blocks fenced with tildes and indented fences', () => {
    const source = ['# Plan: X (#4)', '', '### Tarea 1: A', '', '   ~~~', '# comentario', '   ~~~', '- [x] Hecho', ''].join('\n')
    const plan = parsePlan(source, 4)
    expect(plan?.tasks).toEqual([{ title: 'A', done: true }])
  })
})

describe('parsePlan with task headings that are written a little differently', () => {
  it.each([
    ['### Tarea 3 - Con guion', 'Con guion'],
    ['### Tarea 3. Con punto', 'Con punto'],
    ['### Tarea 3 – Con raya', 'Con raya'],
    ['### Tarea 3: Con dos puntos', 'Con dos puntos'],
    ['### Tarea 3:', 'Tarea 3'],
    ['### Tarea 3', 'Tarea 3'],
  ])('counts "%s" as a task, so a plan is never "finished" by skipping one', (heading, title) => {
    const plan = parsePlan(`# Plan: X (#5)

### Tarea 1: Hecha
- [x] Hecho

${heading}
- [ ] Hecho
`, 5)
    expect(plan?.tasks.map((t) => t.title)).toEqual(['Hecha', title])
    expect(progress(plan!)).toEqual({ done: 1, total: 2 })
  })

  it('does not take a section called "Tareas" for a task', () => {
    const plan = parsePlan(['# Plan: X (#6)', '', '### Tareas', '', '### Tarea 1: A', '- [x] Hecho', ''].join('\n'), 6)
    expect(plan?.tasks).toHaveLength(1)
  })
})

describe('parsePlan with a file that starts with a byte order mark', () => {
  it('still finds the title', () => {
    expect(parsePlan('﻿# Plan: Con BOM (#7)\n', 7)?.title).toBe('Con BOM')
  })
})

describe('parsePlan and the link to the issue', () => {
  const link = (url: string) => parsePlan(`# Plan: X (#8)

- **Issue:** ${url}
`, 8)?.issueUrl

  it('keeps a link to GitHub over https', () => {
    expect(link('https://github.com/o/r/issues/8')).toBe('https://github.com/o/r/issues/8')
  })

  it.each([
    'javascript:alert(1)',
    'data:text/html,<script>alert(1)</script>',
    'http://github.com/o/r/issues/8',
    'https://evil.example/o/r/issues/8',
    'https://github.com.evil.example/o/r/issues/8',
    'not a url',
  ])('drops %s, because the link ends up in an href', (url) => {
    expect(link(url)).toBeNull()
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
