import { memo, useMemo, type Ref } from "react"
import { geoDistance, geoMercator, geoPath } from "d3-geo"
import type { MultiPoint } from "geojson"
import type { Frame } from "@/data/continentFrames"
import type { SphereShape } from "@/game/sphere"

const OCEAN = "#cfe3f1"
const LAND = "#ffffff"
const OTHER = "#e2e8ee"
const OTHER_LINE = "#b8c2cc"
const LINE = "#1f2937"
const VISITED_COLOR = "#009999"
const ACTIVE = "#f59e0b"
const MARGIN = 0.25
const SMALL_AREA = 80

function corners(frame: Frame): [number, number][] {
  return [
    [frame.lon - frame.half, frame.latMin],
    [frame.lon + frame.half, frame.latMin],
    [frame.lon + frame.half, frame.latMax],
    [frame.lon - frame.half, frame.latMax],
  ]
}

interface Props {
  shapes: SphereShape[]
  membership: Record<string, string>
  continent: string
  frame: Frame
  visited: ReadonlySet<string>
  variant?: "full" | "thumb"
  interactive?: boolean
  active?: string | null
  svgRef?: Ref<SVGSVGElement>
  className?: string
}

interface Item {
  code: string
  d: string
  area: number
}

export const ContinentMap = memo(function ContinentMap({
  shapes,
  membership,
  continent,
  frame,
  visited,
  variant = "full",
  interactive = false,
  active = null,
  svgRef,
  className,
}: Props) {
  const w = variant === "thumb" ? 96 : 400
  const h = variant === "thumb" ? 96 : 240

  const paths = useMemo(() => {
    const box: MultiPoint = { type: "MultiPoint", coordinates: corners(frame) }
    const projection = geoMercator().rotate([-frame.lon, 0])
    projection.fitExtent(
      [
        [0, 0],
        [w, h],
      ],
      box,
    )
    const path = geoPath(projection)

    const center: [number, number] = [
      frame.lon,
      (frame.latMin + frame.latMax) / 2,
    ]
    const reach = Math.max(...corners(frame).map((c) => geoDistance(center, c)))

    const own: Item[] = []
    const other: Item[] = []
    for (const s of shapes) {
      const isOwn = membership[s.code] === continent
      if (!isOwn) {
        if (variant === "thumb") continue
        if (geoDistance(s.centroid, center) > reach + s.radius + MARGIN) continue
      }
      const d = path(s.object)
      if (!d) continue
      const item = { code: s.code, d, area: path.area(s.object) }
      if (isOwn) own.push(item)
      else other.push(item)
    }
    own.sort((a, b) => b.area - a.area)
    return { own, other }
  }, [shapes, membership, continent, frame, variant, w, h])

  const lineWidth = variant === "thumb" ? 0.5 : 0.8
  const activeItem = active ? paths.own.find((p) => p.code === active) : undefined

  return (
    <svg
      ref={svgRef}
      viewBox={`0 0 ${w} ${h}`}
      className={className}
      style={{ background: OCEAN }}
      role="img"
      aria-label={`Mapa de ${continent}`}
    >
      {paths.other.map((p) => (
        <path
          key={p.code}
          d={p.d}
          fill={OTHER}
          stroke={OTHER_LINE}
          strokeWidth={0.5}
          strokeLinejoin="round"
          vectorEffect="non-scaling-stroke"
          pointerEvents="none"
        />
      ))}
      {paths.own.map((p) => (
        <path
          key={p.code}
          data-code={interactive ? p.code : undefined}
          d={p.d}
          fill={visited.has(p.code) ? VISITED_COLOR : LAND}
          stroke={LINE}
          strokeWidth={lineWidth}
          strokeLinejoin="round"
          vectorEffect="non-scaling-stroke"
        />
      ))}
      {interactive &&
        paths.own
          .filter((p) => p.area < SMALL_AREA)
          .map((p) => (
            <path
              key={`hit-${p.code}`}
              data-code={p.code}
              d={p.d}
              fill="none"
              stroke="transparent"
              strokeWidth={16}
              vectorEffect="non-scaling-stroke"
              pointerEvents="stroke"
            />
          ))}
      {activeItem && (
        <path
          d={activeItem.d}
          fill="none"
          stroke={ACTIVE}
          strokeWidth={2.5}
          strokeLinejoin="round"
          vectorEffect="non-scaling-stroke"
          pointerEvents="none"
        />
      )}
    </svg>
  )
})