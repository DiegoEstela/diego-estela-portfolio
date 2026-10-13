import { useId, useMemo } from 'react'
import {
  AGENT_IDS,
  DECOR,
  REST_POSE,
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
import {
  BOARD,
  BOARD_HIT_BOX,
  BUBBLE,
  FOCUS_RING,
  REST_STATIONS,
  SCENE_SIZE,
  SOFA,
  STATIONS,
  WALL_COLOR,
  WALL_HEIGHT,
  bubbleAnchor,
  hitBoxFor,
  stationsFor,
  type Box,
} from './layout'
import type { OfficeMode } from './officeMode'
import { progress, type Plan } from './plans'

function rects(sprite: Sprite, x: number, y: number): Rect[] {
  return spriteToRects(sprite.rows, sprite.palette, { x, y })
}

function Pixels({ items }: { items: Rect[] }) {
  return (
    <>
      {items.map((r, index) => (
        <rect key={index} x={r.x} y={r.y} width={r.width} height={r.height} fill={r.fill} />
      ))}
    </>
  )
}

/** Everything that never changes is computed once, when the module loads. */
function buildArt() {
  const stations = Object.fromEntries(
    AGENT_IDS.map((id) => {
      const { cx, y } = STATIONS[id]
      return [
        id,
        {
          character: characterLayers(id).flatMap((layer) => rects(layer, cx - 5, y)),
          monitor: rects(monitorSprite(id), cx - 6, y + 10),
          desk: rects(DECOR.desk, cx - 8, y + 16),
        },
      ]
    }),
  ) as Record<AgentId, { character: Rect[]; monitor: Rect[]; desk: Rect[] }>

  const resting = Object.fromEntries(
    AGENT_IDS.map((id) => {
      const { cx, y } = REST_STATIONS[id]
      return [id, restingLayers(id).flatMap((layer) => rects(layer, cx - 5, y))]
    }),
  ) as Record<AgentId, Rect[]>

  const sofa = sofaSprites(SOFA.width)

  return {
    stations,
    resting,
    sofa: { back: rects(sofa.back, SOFA.x, SOFA.y), seat: rects(sofa.seat, SOFA.x, SOFA.y + SOFA.seatOffset) },
    tile: rects(DECOR.floorTile, 0, 0),
    windows: [rects(DECOR.window, 3, 4), rects(DECOR.window, 95, 4)],
    plants: [rects(DECOR.plant, 3, 56), rects(DECOR.plant, 103, 56)],
  }
}

const ART = buildArt()

export interface OfficeSceneProps {
  agents: ReadonlyArray<{ id: AgentId; label: string }>
  /** Describes the whole picture for screen readers. */
  description: string
  /** A character, the plan board, or nothing. */
  selectedId: AgentId | 'board' | null
  /** The character currently "speaking", highlighted by the rotating spotlight. */
  activeId?: AgentId | null
  /** What the active character is doing, shown as a speech bubble above it. */
  bubble?: { id: AgentId; text: string } | null
  onSelect: (id: AgentId | 'board') => void
  /** At their desks or on the sofa. */
  mode?: OfficeMode
  /** The plan the board shows: its bar fills with the tasks that are done. */
  plan?: Plan | null
  /** Name of the board button. It carries the progress, so the caller writes it in the active language. */
  boardLabel?: string
}

function Bubble({ id, text, mode }: { id: AgentId; text: string; mode: OfficeMode }) {
  const { cx, bubbleY } = stationsFor(mode)[id]
  const { left, tail } = bubbleAnchor(cx)
  return (
    <div
      data-bubble
      aria-hidden="true"
      className="pointer-events-none absolute z-10 rounded-lg px-2 py-1 text-center text-[11px] font-medium leading-snug sm:text-xs"
      style={{
        left: `${(left / SCENE_SIZE.width) * 100}%`,
        top: `${(bubbleY / SCENE_SIZE.height) * 100}%`,
        width: `${(BUBBLE.width / SCENE_SIZE.width) * 100}%`,
        transform: 'translate(-50%, -100%)',
        background: '#F8FAFC',
        color: '#0F172A',
        boxShadow: '0 2px 0 rgba(0,0,0,0.35)',
      }}
    >
      {text}
      <span
        className="absolute -bottom-1 h-2 w-2 rotate-45"
        style={{ left: `calc(50% + ${(tail / BUBBLE.width) * 100}% - 4px)`, background: '#F8FAFC' }}
      />
    </div>
  )
}

const percent = (value: number, of: number) => `${(value / of) * 100}%`

function hitStyle({ left, top, right, bottom }: Box) {
  return {
    left: percent(left, SCENE_SIZE.width),
    top: percent(top, SCENE_SIZE.height),
    width: percent(right - left, SCENE_SIZE.width),
    height: percent(bottom - top, SCENE_SIZE.height),
    outlineColor: FOCUS_RING,
  }
}

export function OfficeScene({
  agents,
  description,
  selectedId,
  activeId = null,
  bubble = null,
  onSelect,
  mode = 'working',
  plan = null,
  boardLabel = 'Plan board',
}: OfficeSceneProps) {
  const floorId = useId()
  const byId = new Map(agents.map((agent) => [agent.id, agent.label]))
  const { done, total } = plan ? progress(plan) : { done: 0, total: 0 }
  const board = useMemo(() => rects(boardSprite(done, total), BOARD.x, BOARD.y), [done, total])
  const resting = mode === 'resting'

  return (
    <div className="relative w-full select-none" style={{ aspectRatio: `${SCENE_SIZE.width} / ${SCENE_SIZE.height}` }}>
      <svg
        viewBox={`0 0 ${SCENE_SIZE.width} ${SCENE_SIZE.height}`}
        className="block h-full w-full"
        role="img"
        aria-label={description}
        shapeRendering="crispEdges"
      >
        <defs>
          <pattern id={floorId} width="8" height="8" patternUnits="userSpaceOnUse">
            <Pixels items={ART.tile} />
          </pattern>
        </defs>

        {/* Back wall and floor */}
        <rect width={SCENE_SIZE.width} height={WALL_HEIGHT} fill={WALL_COLOR} />
        <rect y={WALL_HEIGHT - 2} width={SCENE_SIZE.width} height="2" fill="#2D3A5F" />
        <rect y={WALL_HEIGHT} width={SCENE_SIZE.width} height={SCENE_SIZE.height - WALL_HEIGHT} fill={`url(#${floorId})`} />

        {ART.windows.map((window, index) => (
          <Pixels key={index} items={window} />
        ))}
        <g data-board="">
          <Pixels items={board} />
        </g>
        {ART.plants.map((plant, index) => (
          <Pixels key={index} items={plant} />
        ))}

        {/* The desks. At work each one has its character; at rest they stay, empty. */}
        {AGENT_IDS.map((id, index) => {
          const { cx, y } = STATIONS[id]
          const desk = (
            <g data-desk={id}>
              <Pixels items={ART.stations[id].monitor} />
              <Pixels items={ART.stations[id].desk} />
            </g>
          )
          if (resting) return <g key={id}>{desk}</g>
          return (
            <g key={id} data-agent={id} className="office-station" data-active={activeId === id || undefined}>
              <rect className="office-glow" x={cx - 11} y={y - 1} width="22" height="24" style={{ fill: 'var(--accent)' }} />
              <rect x={cx - 8} y={y + 20} width="16" height="2" fill="#000000" opacity="0.25" />
              <g className="office-character" style={{ animationDelay: `${(index * 0.23).toFixed(2)}s` }}>
                <Pixels items={ART.stations[id].character} />
              </g>
              {desk}
            </g>
          )
        })}

        <g data-sofa="back">
          <Pixels items={ART.sofa.back} />
        </g>

        {resting &&
          AGENT_IDS.map((id, index) => {
            const { cx, y } = REST_STATIONS[id]
            return (
              <g key={id} data-agent={id} data-pose={REST_POSE[id]} className="office-station" data-active={activeId === id || undefined}>
                <rect className="office-glow" x={cx - 11} y={y - 1} width="22" height="17" style={{ fill: 'var(--accent)' }} />
                <g className="office-character office-resting" style={{ animationDelay: `${(index * 0.23).toFixed(2)}s` }}>
                  <Pixels items={ART.resting[id]} />
                </g>
              </g>
            )
          })}

        {/* The seat goes last: it hides the legs of whoever sits. */}
        <g data-sofa="seat">
          <Pixels items={ART.sofa.seat} />
        </g>
      </svg>

      {bubble && <Bubble id={bubble.id} text={bubble.text} mode={mode} />}

      {/* Real buttons over the drawing: keyboard, screen reader and touch work without extra code. */}
      {AGENT_IDS.map((id) => {
        const selected = selectedId === id
        return (
          <button
            key={id}
            type="button"
            data-agent={id}
            aria-label={byId.get(id) ?? id}
            aria-pressed={selected}
            onClick={() => onSelect(id)}
            className="absolute rounded-md bg-transparent transition-colors hover:bg-white/10 focus-visible:outline-2 focus-visible:outline-offset-1"
            style={{ ...hitStyle(hitBoxFor(mode, id)), boxShadow: selected ? `inset 0 0 0 2px ${FOCUS_RING}` : undefined }}
          />
        )
      })}

      {/* The board comes after the characters in tab order, the way the eye reads the scene. */}
      <button
        type="button"
        data-board-button=""
        aria-label={boardLabel}
        aria-pressed={selectedId === 'board'}
        onClick={() => onSelect('board')}
        className="absolute rounded-md bg-transparent transition-colors hover:bg-white/10 focus-visible:outline-2 focus-visible:outline-offset-1"
        style={{ ...hitStyle(BOARD_HIT_BOX), boxShadow: selectedId === 'board' ? `inset 0 0 0 2px ${FOCUS_RING}` : undefined }}
      />
    </div>
  )
}
