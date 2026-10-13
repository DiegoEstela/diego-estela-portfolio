import {
  BOARD,
  BUBBLE,
  FOCUS_RING,
  REST_STATIONS,
  SCENE_SIZE,
  SOFA,
  STATIONS,
  WALL_COLOR,
  WALL_HEIGHT,
  bubbleAnchor,
} from './layout'
import {
  AGENT_IDS,
  BOARD_BAR,
  DECOR,
  REST_POSE,
  boardFilledCells,
  boardSprite,
  characterLayers,
  monitorSprite,
  restingLayers,
  sofaSprites,
  spriteToRects,
  type AgentId,
  type Rect,
  type Sprite,
} from './sprites'

/**
 * The agents office as a standalone animated SVG, for places that cannot run the app (the
 * README). It draws the same sprites and stations as OfficeScene, so it cannot drift from the
 * web. Only CSS animates it: GitHub shows animated SVGs inside <img> but blocks scripts.
 *
 * It tells the story of the office in one loop: the team works while the bar of the plan board
 * fills one pixel at a time, then the plan is done and everybody goes to rest on the sofa.
 */

export interface OfficeSvgInput {
  /** Accessible name of the whole picture. */
  title: string
  /** What each character is doing, shown in its speech bubble while it is in the spotlight. */
  agents: Record<AgentId, { doing: string }>
}

/** Seconds each character stays in the spotlight, the whole tour, the rest and the loop. */
const SLOT = 3.6
const WORK = SLOT * AGENT_IDS.length
const REST = 6
const CYCLE = WORK + REST
const WORK_SHARE = (WORK / CYCLE) * 100
const SLOT_SHARE = (SLOT / CYCLE) * 100

/** Widest bubble line, in characters: at the font size below it fits inside BUBBLE.width. */
const MAX_LINE = 22
const FONT_SIZE = 3.2
const LINE_HEIGHT = 4

const BAR_FILL = '#15803D'

const escapeXml = (text: string) =>
  text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')

function wrap(text: string): string[] {
  const lines: string[] = []
  let current = ''
  for (const word of text.split(/\s+/).filter(Boolean)) {
    if (current && `${current} ${word}`.length > MAX_LINE) {
      lines.push(current)
      current = word
    } else {
      current = current ? `${current} ${word}` : word
    }
  }
  if (current) lines.push(current)
  return lines
}

const rectsOf = (sprite: Sprite, x: number, y: number): Rect[] => spriteToRects(sprite.rows, sprite.palette, { x, y })

const draw = (items: Rect[]) =>
  items.map((r) => `<rect x="${r.x}" y="${r.y}" width="${r.width}" height="${r.height}" fill="${r.fill}"/>`).join('')

const seconds = (value: number) => `${value.toFixed(2).replace(/\.?0+$/, '')}s`
const percent = (value: number) => `${value.toFixed(2).replace(/\.?0+$/, '')}%`

const CELLS = boardFilledCells(1, 1)

const STYLE = `
.office-character { animation: office-bob 1.2s steps(1, end) infinite; }
.office-resting { animation: office-breathe 2.8s steps(1, end) infinite; }
.office-zzz { animation: office-zzz 1.6s steps(1, end) infinite; }
.office-glow { animation: office-glow 1.4s steps(1, end) infinite; }
.spot { opacity: 0; animation: office-spot ${seconds(CYCLE)} steps(1, end) infinite; }
.phase { animation-duration: ${seconds(CYCLE)}; animation-timing-function: steps(1, end); animation-iteration-count: infinite; }
.phase-work { animation-name: office-work; }
.phase-rest { opacity: 0; animation-name: office-rest; }
.office-bar { transform-box: fill-box; transform-origin: 0 50%; animation: office-bar ${seconds(CYCLE)} steps(${CELLS}, end) infinite; }
@keyframes office-bob { 0%, 100% { transform: translateY(0); } 50% { transform: translateY(-1px); } }
@keyframes office-breathe { 0%, 100% { transform: translateY(0); } 50% { transform: translateY(1px); } }
@keyframes office-zzz { 0%, 100% { transform: translateY(0); opacity: 1; } 50% { transform: translateY(-1px); opacity: 0.55; } }
@keyframes office-glow { 0%, 100% { opacity: 0.1; } 50% { opacity: 0.22; } }
@keyframes office-spot { 0% { opacity: 1; } ${percent(SLOT_SHARE)} { opacity: 0; } 100% { opacity: 0; } }
@keyframes office-work { 0% { opacity: 1; } ${percent(WORK_SHARE)} { opacity: 0; } 100% { opacity: 0; } }
@keyframes office-rest { 0% { opacity: 0; } ${percent(WORK_SHARE)} { opacity: 1; } 100% { opacity: 1; } }
@keyframes office-bar { 0% { transform: scaleX(0); } ${percent(WORK_SHARE)} { transform: scaleX(1); } 100% { transform: scaleX(1); } }
@media (prefers-reduced-motion: reduce) {
  .office-character, .office-resting, .office-zzz, .office-glow, .spot, .phase, .office-bar { animation: none; }
  .spot[data-first] { opacity: 1; }
  .phase-rest { opacity: 0; }
  .office-bar { transform: scaleX(0.6); }
}`

function bubble(id: AgentId, text: string, index: number): string {
  const { cx, bubbleY } = STATIONS[id]
  const { left } = bubbleAnchor(cx)
  const x = left - BUBBLE.width / 2
  const y = bubbleY - BUBBLE.height
  const lines = wrap(text)
  const firstBaseline = y + (BUBBLE.height - (lines.length - 1) * LINE_HEIGHT) / 2 + FONT_SIZE / 3
  const spans = lines
    .map((line, i) => `<text x="${left}" y="${firstBaseline + i * LINE_HEIGHT}" text-anchor="middle">${escapeXml(line)}</text>`)
    .join('')
  return (
    `<g class="spot" data-bubble="${id}"${index === 0 ? ' data-first=""' : ''} style="animation-delay:${seconds(index * SLOT)}">` +
    `<rect x="${x}" y="${y + 0.8}" width="${BUBBLE.width}" height="${BUBBLE.height}" rx="1.5" fill="#000000" opacity="0.35"/>` +
    `<rect x="${x}" y="${y}" width="${BUBBLE.width}" height="${BUBBLE.height}" rx="1.5" fill="#F8FAFC"/>` +
    `<polygon points="${cx - 1.5},${bubbleY} ${cx + 1.5},${bubbleY} ${cx},${bubbleY + 2}" fill="#F8FAFC"/>` +
    `<g fill="#0F172A" font-family="ui-monospace, SFMono-Regular, Menlo, Consolas, monospace" font-size="${FONT_SIZE}" font-weight="600">${spans}</g>` +
    '</g>'
  )
}

/** The board of the wall: the sprite with an empty bar, and a bar on top that fills pixel by pixel. */
function board(): string {
  const bar = `<rect class="office-bar" x="${BOARD.x + BOARD_BAR.x}" y="${BOARD.y + BOARD_BAR.y}" width="${CELLS}" height="1" fill="${BAR_FILL}"/>`
  return `<g data-board="">${draw(rectsOf(boardSprite(0, 1), BOARD.x, BOARD.y))}${bar}</g>`
}

export function renderOfficeSvg({ title, agents }: OfficeSvgInput): string {
  const { width, height } = SCENE_SIZE

  const working = AGENT_IDS.map((id, index) => {
    const { cx, y } = STATIONS[id]
    const character = characterLayers(id).flatMap((layer) => rectsOf(layer, cx - 5, y))
    return (
      `<g data-agent="${id}">` +
      `<g class="spot" data-spot=""${index === 0 ? ' data-first=""' : ''} style="animation-delay:${seconds(index * SLOT)}">` +
      `<rect class="office-glow" x="${cx - 11}" y="${y - 1}" width="22" height="24" fill="${FOCUS_RING}"/></g>` +
      `<rect x="${cx - 8}" y="${y + 20}" width="16" height="2" fill="#000000" opacity="0.25"/>` +
      `<g class="office-character" style="animation-delay:${seconds(index * 0.23)}">${draw(character)}</g>` +
      '</g>'
    )
  }).join('')

  // The desks belong to neither phase: the team leaves them in the rest phase and they stay.
  const desks = AGENT_IDS.map((id) => {
    const { cx, y } = STATIONS[id]
    return `<g data-desk="${id}">${draw(rectsOf(monitorSprite(id), cx - 6, y + 10))}${draw(rectsOf(DECOR.desk, cx - 8, y + 16))}</g>`
  }).join('')

  const seated = AGENT_IDS.map((id, index) => {
    const { cx, y } = REST_STATIONS[id]
    const layers = restingLayers(id)
    const body = layers.slice(0, -1).flatMap((layer) => rectsOf(layer, cx - 5, y))
    const overlay = layers.slice(-1).flatMap((layer) => rectsOf(layer, cx - 5, y))
    return (
      `<g data-seated="${id}" data-pose="${REST_POSE[id]}">` +
      `<g class="office-character office-resting" style="animation-delay:${seconds(index * 0.23)}">${draw(body)}` +
      `<g class="office-zzz" style="animation-delay:${seconds(index * 0.37)}">${draw(overlay)}</g></g>` +
      '</g>'
    )
  }).join('')

  const sofa = sofaSprites(SOFA.width)
  const bubbles = AGENT_IDS.map((id, index) => bubble(id, agents[id].doing, index)).join('')

  return (
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${width} ${height}" role="img" shape-rendering="crispEdges">` +
    `<title>${escapeXml(title)}</title>` +
    `<style>${STYLE}</style>` +
    `<defs><pattern id="floor" width="8" height="8" patternUnits="userSpaceOnUse">${draw(rectsOf(DECOR.floorTile, 0, 0))}</pattern></defs>` +
    `<rect width="${width}" height="${WALL_HEIGHT}" fill="${WALL_COLOR}"/>` +
    `<rect y="${WALL_HEIGHT - 2}" width="${width}" height="2" fill="#2D3A5F"/>` +
    `<rect y="${WALL_HEIGHT}" width="${width}" height="${height - WALL_HEIGHT}" fill="url(#floor)"/>` +
    draw(rectsOf(DECOR.window, 3, 4)) +
    draw(rectsOf(DECOR.window, 95, 4)) +
    board() +
    draw(rectsOf(DECOR.plant, 3, 56)) +
    draw(rectsOf(DECOR.plant, 103, 56)) +
    `<g class="phase phase-work" data-phase="work">${working}</g>` +
    desks +
    `<g data-sofa="back">${draw(rectsOf(sofa.back, SOFA.x, SOFA.y))}</g>` +
    `<g class="phase phase-rest" data-phase="rest">${seated}</g>` +
    `<g data-sofa="seat">${draw(rectsOf(sofa.seat, SOFA.x, SOFA.y + SOFA.seatOffset))}</g>` +
    bubbles +
    '</svg>\n'
  )
}
