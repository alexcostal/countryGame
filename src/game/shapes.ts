export type Position = number[]
export type Polygon = Position[][]
export type Geometry =
  | { type: "Polygon"; coordinates: Polygon }
  | { type: "MultiPolygon"; coordinates: Polygon[] }

export interface Focus {
  lat: number
  lng: number
}

interface Box {
  minX: number
  maxX: number
  minY: number
  maxY: number
}

function boxOf(polygons: Polygon[]): Box {
  let minX = Infinity
  let maxX = -Infinity
  let minY = Infinity
  let maxY = -Infinity
  for (const polygon of polygons) {
    for (const [x, y] of polygon[0]) {
      if (x < minX) minX = x
      if (x > maxX) maxX = x
      if (y < minY) minY = y
      if (y > maxY) maxY = y
    }
  }
  return { minX, maxX, minY, maxY }
}

const area = (b: Box) => (b.maxX - b.minX) * (b.maxY - b.minY)
const MIN_AREA_RATIO = 0.01
const MARKER_TOLERANCE = 0.25

function gap(b: Box, f: Focus): number {
  const dx = Math.max(b.minX - f.lng, 0, f.lng - b.maxX)
  const dy = Math.max(b.minY - f.lat, 0, f.lat - b.maxY)
  return Math.hypot(dx, dy)
}

function mainPolygons(
  geometry: Geometry,
  focus?: Focus,
  showAll = false,
): Polygon[] {
  const polys =
    geometry.type === "Polygon" ? [geometry.coordinates] : geometry.coordinates
  if (showAll || polys.length <= 1) return polys

  const boxes = polys.map((p) => boxOf([p]))
  let main = 0
  boxes.forEach((b, i) => {
    if (area(b) > area(boxes[main])) main = i
  })

  const m = boxes[main]
  const reach = 1.5 * Math.max(m.maxX - m.minX, m.maxY - m.minY)
  const cx = (m.minX + m.maxX) / 2
  const cy = (m.minY + m.maxY) / 2

  const keep = new Set<number>()
  boxes.forEach((b, i) => {
    const close =
      Math.abs((b.minX + b.maxX) / 2 - cx) <= reach &&
      Math.abs((b.minY + b.maxY) / 2 - cy) <= reach
    if (i === main || (area(b) >= area(m) * MIN_AREA_RATIO && close)) keep.add(i)
  })

  if (focus) {
    let closest = 0
    boxes.forEach((b, i) => {
      if (gap(b, focus) < gap(boxes[closest], focus)) closest = i
    })
    keep.add(closest)
  }

  return polys.filter((_, i) => keep.has(i))
}

function inRing(x: number, y: number, ring: Position[]): boolean {
  let inside = false
  for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
    const [xi, yi] = ring[i]
    const [xj, yj] = ring[j]
    if (yi > y !== yj > y && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi) {
      inside = !inside
    }
  }
  return inside
}

export function placeMarker(
  polygons: Polygon[],
  point: Focus,
  span: number,
): Focus | null {
  if (polygons.some((p) => inRing(point.lng, point.lat, p[0]))) return point

  let best: Focus | null = null
  let bestDist = Infinity
  for (const polygon of polygons) {
    for (const [x, y] of polygon[0]) {
      const d = Math.hypot(x - point.lng, y - point.lat)
      if (d < bestDist) {
        bestDist = d
        best = { lat: y, lng: x }
      }
    }
  }
  return best && bestDist <= span * MARKER_TOLERANCE ? best : null
}

export function buildShape(geometry: Geometry, focus?: Focus, showAll = false) {
  const polygons = mainPolygons(geometry, focus, showAll)
  const { minX, maxX, minY, maxY } = boxOf(polygons)
  const k = Math.cos((((minY + maxY) / 2) * Math.PI) / 180)

  const d = polygons
    .flatMap((polygon) =>
      polygon.map(
        (ring) =>
          ring
            .map(
              ([x, y], i) =>
                `${i === 0 ? "M" : "L"}${((x - minX) * k).toFixed(3)} ${(maxY - y).toFixed(3)}`,
            )
            .join("") + "Z",
      ),
    )
    .join("")

  const project = (lng: number, lat: number) => ({
    x: (lng - minX) * k,
    y: maxY - lat,
  })

  return {
    d,
    width: (maxX - minX) * k,
    height: maxY - minY,
    project,
    polygons,
    span: Math.max(maxX - minX, maxY - minY),
  }
}