import type { Geometry } from "./shapes"

const STEP = 0.08
const SKIP = new Set(["AQ"])

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

export function buildWorldPaths(geometries: Record<string, Geometry>) {
  const result: { code: string; d: string }[] = []
  for (const [code, geometry] of Object.entries(geometries)) {
    if (SKIP.has(code)) continue
    const polygons =
      geometry.type === "Polygon" ? [geometry.coordinates] : geometry.coordinates
    const d = polygons.flatMap((polygon) => polygon.map(ringToPath)).join("")
    if (d) result.push({ code, d })
  }
  return result
}