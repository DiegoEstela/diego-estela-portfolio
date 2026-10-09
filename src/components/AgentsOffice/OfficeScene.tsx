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
import { HIT, SCENE_SIZE, STATIONS, WALL_HEIGHT } from './layout'

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
    windows: [rects(DECOR.window, 12, 7), rects(DECOR.window, 134, 7)],
    board: rects(DECOR.board, 71, 9),
    plants: [rects(DECOR.plant, 10, 70), rects(DECOR.plant, 144, 70)],
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
  onSelect: (id: AgentId) => void
}

export function OfficeScene({ agents, description, selectedId, activeId = null, onSelect }: OfficeSceneProps) {
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
        <rect width={SCENE_SIZE.width} height={WALL_HEIGHT} fill="#1B2540" />
        <rect y={WALL_HEIGHT - 2} width={SCENE_SIZE.width} height="2" fill="#2D3A5F" />
        <rect y={WALL_HEIGHT} width={SCENE_SIZE.width} height={SCENE_SIZE.height - WALL_HEIGHT} fill={`url(#${floorId})`} />

        {ART.windows.map((window, index) => (
          <Pixels key={index} items={window} />
        ))}
        <Pixels items={ART.board} />
        {ART.plants.map((plant, index) => (
          <Pixels key={index} items={plant} />
        ))}

        {AGENT_IDS.map((id) => {
          const { cx, y } = STATIONS[id]
          return (
            <g key={id} data-agent={id} className="office-station" data-active={activeId === id || undefined}>
              <rect x={cx - 8} y={y + 20} width="16" height="2" fill="#000000" opacity="0.25" />
              <g className="office-character">
                <Pixels items={ART.stations[id].character} />
              </g>
              <Pixels items={ART.stations[id].monitor} />
              <Pixels items={ART.stations[id].desk} />
            </g>
          )
        })}
      </svg>

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
              outlineColor: 'var(--accent)',
              boxShadow: selected ? 'inset 0 0 0 2px var(--accent)' : undefined,
            }}
          />
        )
      })}
    </div>
  )
}
