import { geoArea, geoCentroid } from "d3-geo"
import type { MultiPolygon } from "geojson"
import type { Geometry } from "./shapes"

const STEP = 0.35
const SKIP = new Set(["AQ"])

type Pos = number[]
type Poly = Pos[][]

export interface SphereShape {
  code: string
  object: MultiPolygon
  centroid: [number, number]
  radius: number
}

function thin(ring: Pos[]): Pos[] {
  if (ring.length < 60) return ring
  const out = [ring[0]]
  let last = ring[0]
  for (let i = 1; i < ring.length - 1; i++) {
    const p = ring[i]
    if (Math.hypot(p[0] - last[0], p[1] - last[1]) >= STEP) {
      out.push(p)
      last = p
    }
  }
  out.push(ring[ring.length - 1])
  return out.length >= 4 ? out : ring
}

function fixPolygon(poly: Poly): Poly {
  const thinned = poly.map(thin)
  const area = geoArea({ type: "Polygon", coordinates: thinned })
  return area > 2 * Math.PI ? thinned.map((ring) => [...ring].reverse()) : thinned
}

export function prepareShapes(
  geometries: Record<string, Geometry>,
): SphereShape[] {
  const out: SphereShape[] = []
  for (const [code, g] of Object.entries(geometries)) {
    if (SKIP.has(code)) continue
    const polys = g.type === "Polygon" ? [g.coordinates] : g.coordinates
    const object: MultiPolygon = {
      type: "MultiPolygon",
      coordinates: polys.map(fixPolygon),
    }
    out.push({
      code,
      object,
      centroid: geoCentroid(object),
      radius: Math.sqrt(geoArea(object) / Math.PI),
    })
  }
  return out
}