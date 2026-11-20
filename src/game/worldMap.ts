import type { Geometry, Polygon } from "./shapes"

const STEP = 0.08
const SKIP = new Set(["AQ"])
const MIN_AREA = 0.5
const SMALL_AREA = 6

function ringToPath(ring: number[][]): string {
  const pts: number[][] = []
  let last: number[] | null = null
  for (const p of ring) {
    if (
      !last ||
      Math.abs(p[0] - last[0]) >= STEP ||
      Math.abs(p[1] - last[1]) >= STEP
    ) {
      pts.push(p)
      last = p
    }
  }
  if (pts.length < 3) return ""
  const coords = pts.map(
    ([lng, lat]) => `${(lng + 180).toFixed(2)} ${(90 - lat).toFixed(2)}`,
  )
  return `M${coords.join("L")}Z`
}

function bboxArea(ring: number[][]): number {
  let minX = Infinity
  let maxX = -Infinity
  let minY = Infinity
  let maxY = -Infinity
  for (const [x, y] of ring) {
    if (x < minX) minX = x
    if (x > maxX) maxX = x
    if (y < minY) minY = y
    if (y > maxY) maxY = y
  }
  return (maxX - minX) * (maxY - minY)
}

export interface WorldPath {
  code: string
  d: string
  small: boolean
}

export function buildWorldPaths(
  geometries: Record<string, Geometry>,
): WorldPath[] {
  const result: WorldPath[] = []
  for (const [code, geometry] of Object.entries(geometries)) {
    if (SKIP.has(code)) continue
    const polygons: Polygon[] =
      geometry.type === "Polygon" ? [geometry.coordinates] : geometry.coordinates
    const areas = polygons.map((p) => bboxArea(p[0]))
    const largest = Math.max(...areas)
    const kept = polygons.filter(
      (_, i) => areas[i] >= MIN_AREA || areas[i] === largest,
    )
    const d = kept.flatMap((polygon) => polygon.map(ringToPath)).join("")
    if (d) result.push({ code, d, small: largest < SMALL_AREA })
  }
  return result
}