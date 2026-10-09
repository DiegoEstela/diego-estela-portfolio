import { useId } from 'react'
import {
  AGENT_IDS,
  DECOR,
  characterLayers,
  monitorSprite,
  spriteToRects,
  type AgentId,
  type Rect,
  type Sprite,
} from './sprites'
import { BUBBLE, FOCUS_RING, HIT, SCENE_SIZE, STATIONS, WALL_COLOR, WALL_HEIGHT, bubbleAnchor } from './layout'

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

  return {
    stations,
    tile: rects(DECOR.floorTile, 0, 0),
    windows: [rects(DECOR.window, 3, 4), rects(DECOR.window, 95, 4)],
    board: rects(DECOR.board, 47, 5),
    plants: [rects(DECOR.plant, 3, 56), rects(DECOR.plant, 103, 56)],
  }
}

const ART = buildArt()

export interface OfficeSceneProps {
  agents: ReadonlyArray<{ id: AgentId; label: string }>
  /** Describes the whole picture for screen readers. */
  description: string
  selectedId: AgentId | null
  /** The character currently "speaking", highlighted by the rotating spotlight. */
  activeId?: AgentId | null
  /** What the active character is doing, shown as a speech bubble above it. */
  bubble?: { id: AgentId; text: string } | null
  onSelect: (id: AgentId) => void
}

function Bubble({ id, text }: { id: AgentId; text: string }) {
  const { cx, bubbleY } = STATIONS[id]
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

export function OfficeScene({ agents, description, selectedId, activeId = null, bubble = null, onSelect }: OfficeSceneProps) {
  const floorId = useId()
  const byId = new Map(agents.map((agent) => [agent.id, agent.label]))

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
        <Pixels items={ART.board} />
        {ART.plants.map((plant, index) => (
          <Pixels key={index} items={plant} />
        ))}

        {AGENT_IDS.map((id, index) => {
          const { cx, y } = STATIONS[id]
          return (
            <g key={id} data-agent={id} className="office-station" data-active={activeId === id || undefined}>
              <rect className="office-glow" x={cx - 11} y={y - 1} width="22" height="24" style={{ fill: 'var(--accent)' }} />
              <rect x={cx - 8} y={y + 20} width="16" height="2" fill="#000000" opacity="0.25" />
              <g className="office-character" style={{ animationDelay: `${(index * 0.23).toFixed(2)}s` }}>
                <Pixels items={ART.stations[id].character} />
              </g>
              <Pixels items={ART.stations[id].monitor} />
              <Pixels items={ART.stations[id].desk} />
            </g>
          )
        })}
      </svg>

      {bubble && <Bubble id={bubble.id} text={bubble.text} />}

      {/* Real buttons over the drawing: keyboard, screen reader and touch work without extra code. */}
      {AGENT_IDS.map((id) => {
        const { cx, y } = STATIONS[id]
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
            style={{
              left: `${((cx - HIT.width / 2) / SCENE_SIZE.width) * 100}%`,
              top: `${(y / SCENE_SIZE.height) * 100}%`,
              width: `${(HIT.width / SCENE_SIZE.width) * 100}%`,
              height: `${(HIT.height / SCENE_SIZE.height) * 100}%`,
              outlineColor: FOCUS_RING,
              boxShadow: selected ? `inset 0 0 0 2px ${FOCUS_RING}` : undefined,
            }}
          />
        )
      })}
    </div>
  )
}
