import { readFileSync, writeFileSync } from "node:fs"

const [input, output, decimals = "2"] = process.argv.slice(2)
const d = Number(decimals)
const round = (n) => Number(n.toFixed(d))

function roundCoords(c) {
  return typeof c[0] === "number" ? c.map(round) : c.map(roundCoords)
}

function countPoints(geometry) {
  const polygons =
    geometry.type === "Polygon" ? [geometry.coordinates] : geometry.coordinates
  return polygons.reduce(
    (sum, poly) => sum + poly.reduce((t, ring) => t + ring.length, 0),
    0,
  )
}

const data = JSON.parse(readFileSync(input, "utf8"))
const byCode = new Map()

for (const f of data.features) {
  const p = f.properties
  const code = [p.ISO_A2_EH, p.ISO_A2].find(
    (c) => typeof c === "string" && c !== "-99",
  )
  if (!code) continue
  const points = countPoints(f.geometry)
  const current = byCode.get(code)
  if (!current || points > current.points) {
    byCode.set(code, { code, name: p.NAME, geometry: f.geometry, points })
  }
}

const features = [...byCode.values()].map(({ code, name, geometry }) => ({
  type: "Feature",
  properties: { ISO_A2: code, ISO_A2_EH: code, NAME: name },
  geometry: {
    type: geometry.type,
    coordinates: roundCoords(geometry.coordinates),
  },
}))

writeFileSync(output, JSON.stringify({ type: "FeatureCollection", features }))
console.log(`${features.length} países guardados en ${output}`)