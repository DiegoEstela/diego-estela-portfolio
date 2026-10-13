// @vitest-environment node
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join, resolve } from 'node:path'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { progress } from '../src/components/AgentsOffice/planParser'
import { latestPlanModule, latestPlanPlugin, readPlans } from './latestPlan'

const dirs: string[] = []

function plansDir(files: Record<string, string>) {
  const dir = mkdtempSync(join(tmpdir(), 'plans-'))
  dirs.push(dir)
  mkdirSync(dir, { recursive: true })
  for (const [name, content] of Object.entries(files)) writeFileSync(join(dir, name), content)
  return dir
}

const plan = (title: string, issue: number, ...done: boolean[]) =>
  `# Plan: ${title} (#${issue})\n\n- **Issue:** https://github.com/o/r/issues/${issue}\n\n` +
  done.map((d, i) => `### Tarea ${i + 1}: Paso ${i + 1}\n\n- [${d ? 'x' : ' '}] Hecho\n`).join('\n')

afterEach(() => {
  while (dirs.length) rmSync(dirs.pop()!, { recursive: true, force: true })
})

describe('readPlans', () => {
  it('reads the plans written with an issue number', () => {
    const dir = plansDir({ '3-feat-a.md': plan('Tres', 3, true), '12-fix-b.md': plan('Doce', 12, true, false) })
    expect(readPlans(dir).map((p) => [p.issue, p.title])).toEqual([[3, 'Tres'], [12, 'Doce']])
  })

  it('ignores plans without an issue number, other file types and files without a title', () => {
    const dir = plansDir({
      '5-ok.md': plan('Cinco', 5, true),
      'readme-for-recruiters.md': plan('Sin issue', 99, true),
      '6-notes.txt': plan('No es markdown', 6, true),
      '7-sin-titulo.md': 'Nada que ver aquí\n',
    })
    expect(readPlans(dir).map((p) => p.issue)).toEqual([5])
  })

  it('reads the real plans of the repository, whose tasks are all done', () => {
    const plans = readPlans(resolve('docs/plans'))
    for (const issue of [10, 11, 18]) {
      const real = plans.find((p) => p.issue === issue)
      expect(real, `plan #${issue}`).toBeDefined()
      const { done, total } = progress(real!)
      expect(total, `plan #${issue}`).toBeGreaterThan(0)
      expect(done, `plan #${issue}`).toBe(total)
    }
  })
})

describe('latestPlanModule', () => {
  const read = (source: string) => JSON.parse(source.replace(/^export default /, '')) as unknown

  it('exports only the plan of the highest issue number', () => {
    const plans = readPlans(plansDir({ '9-a.md': plan('Nueve', 9, true), '10-b.md': plan('Diez', 10, true, false) }))
    expect(read(latestPlanModule(plans))).toMatchObject({ issue: 10, title: 'Diez' })
  })

  it('exports null when there are no plans', () => {
    expect(latestPlanModule([]).trim()).toBe('export default null')
  })

  it('carries no prose: only the title, the link and the tasks', () => {
    const dir = plansDir({
      '1-old.md': `${plan('Antiguo', 1, true)}\n\nPROSA-CENTINELA con VITE_ANTHROPIC_API_KEY\n`,
      '2-new.md': `${plan('Nuevo', 2, true, false)}\n\nOtra PROSA-CENTINELA\n`,
    })
    const source = latestPlanModule(readPlans(dir))
    expect(source).not.toContain('PROSA-CENTINELA')
    expect(source).not.toContain('VITE_ANTHROPIC')
    expect(Object.keys(read(source) as object).sort()).toEqual(['issue', 'issueUrl', 'tasks', 'title'])
  })
})

describe('latestPlanPlugin', () => {
  const ID = 'virtual:latest-plan'

  it('answers only for its own virtual module', () => {
    const plugin = latestPlanPlugin(plansDir({}))
    const resolveId = plugin.resolveId as (id: string) => string | null
    expect(resolveId(ID)).toBe(`\0${ID}`)
    expect(resolveId('react')).toBeNull()
  })

  it('loads the latest plan of its folder and watches the files it read', () => {
    const dir = plansDir({ '1-a.md': plan('Uno', 1, true), '2-b.md': plan('Dos', 2, false) })
    const plugin = latestPlanPlugin(dir)
    const addWatchFile = vi.fn()
    const load = plugin.load as (this: { addWatchFile: (file: string) => void }, id: string) => string | null
    const source = load.call({ addWatchFile }, `\0${ID}`)
    expect(source).toContain('"issue":2')
    expect(addWatchFile).toHaveBeenCalledWith(join(dir, '2-b.md'))
  })

  it('does not load anything else', () => {
    const plugin = latestPlanPlugin(plansDir({}))
    const load = plugin.load as (this: { addWatchFile: (file: string) => void }, id: string) => string | null
    expect(load.call({ addWatchFile: vi.fn() }, 'src/main.tsx')).toBeNull()
  })
})

describe('readPlans in a folder that is not tidy', () => {
  it('returns nothing when the folder does not exist, instead of breaking the build', () => {
    expect(readPlans(join(tmpdir(), 'plans-that-do-not-exist'))).toEqual([])
  })

  it('skips entries that are not files, even if they are called like a plan', () => {
    const dir = plansDir({ '4-real.md': plan('Cuatro', 4, true) })
    mkdirSync(join(dir, '9-carpeta.md'))
    expect(readPlans(dir).map((p) => p.issue)).toEqual([4])
  })
})

describe('latestPlanPlugin in a project without plans yet', () => {
  const load = (plugin: ReturnType<typeof latestPlanPlugin>, addWatchFile = vi.fn()) =>
    (plugin.load as (this: { addWatchFile: (file: string) => void }, id: string) => string | null).call({ addWatchFile }, '\0virtual:latest-plan')

  it('serves null when the folder does not exist', () => {
    expect(load(latestPlanPlugin(join(tmpdir(), 'plans-that-do-not-exist')))?.trim()).toBe('export default null')
  })

  it('only asks Vite to watch files: a folder is resolved as an import and breaks every module that loads the plan', () => {
    const dir = plansDir({ '1-a.md': plan('Uno', 1, true) })
    const addWatchFile = vi.fn()
    load(latestPlanPlugin(dir), addWatchFile)
    expect(addWatchFile).toHaveBeenCalledWith(join(dir, '1-a.md'))
    expect(addWatchFile).not.toHaveBeenCalledWith(dir)
  })

  describe('in the dev server', () => {
    const MODULE_ID = '\0virtual:latest-plan'

    function devServer() {
      const handlers = new Map<string, (file: string) => void>()
      const server = {
        watcher: {
          add: vi.fn(),
          on: vi.fn((event: string, handler: (file: string) => void) => void handlers.set(event, handler)),
        },
        moduleGraph: { getModuleById: vi.fn(() => ({ id: MODULE_ID })), invalidateModule: vi.fn() },
        ws: { send: vi.fn() },
      }
      return { server, handlers }
    }
    const configure = (plugin: ReturnType<typeof latestPlanPlugin>, server: unknown) =>
      (plugin.configureServer as (server: unknown) => void)(server)

    it('watches the folder, so a plan created or deleted while it runs refreshes the board', () => {
      const dir = plansDir({})
      const { server, handlers } = devServer()
      configure(latestPlanPlugin(dir), server)
      expect(server.watcher.add).toHaveBeenCalledWith(dir)

      handlers.get('add')!(join(dir, '9-nuevo.md'))
      expect(server.moduleGraph.invalidateModule).toHaveBeenCalledTimes(1)
      expect(server.ws.send).toHaveBeenCalledWith({ type: 'full-reload' })

      handlers.get('unlink')!(join(dir, '9-nuevo.md'))
      expect(server.moduleGraph.invalidateModule).toHaveBeenCalledTimes(2)
    })

    it('ignores files that appear anywhere else in the project', () => {
      const dir = plansDir({})
      const { server, handlers } = devServer()
      configure(latestPlanPlugin(dir), server)
      handlers.get('add')!(join(tmpdir(), 'otra-cosa', 'x.md'))
      expect(server.moduleGraph.invalidateModule).not.toHaveBeenCalled()
      expect(server.ws.send).not.toHaveBeenCalled()
    })
  })

  it('looks for the plans from the root of the project, not from the folder the command was run in', () => {
    const root = mkdtempSync(join(tmpdir(), 'root-'))
    dirs.push(root)
    mkdirSync(join(root, 'docs', 'plans'), { recursive: true })
    writeFileSync(join(root, 'docs', 'plans', '7-x.md'), plan('Siete', 7, true))
    const plugin = latestPlanPlugin()
    ;(plugin.configResolved as (config: { root: string }) => void)({ root })
    expect(load(plugin)).toContain('"issue":7')
  })
})
