import { readFileSync, writeFileSync } from "node:fs"

const input = process.argv[2] ?? "raw-land.geojson"
const round = (n) => Math.round(n * 10) / 10
const polygonsOf = (g) => (g.type === "Polygon" ? [g.coordinates] : g.coordinates)

function thin(ring, step) {
  if (ring.length < 30) return ring
  const out = [ring[0]]
  let last = ring[0]
  for (let i = 1; i < ring.length - 1; i++) {
    const p = ring[i]
    if (Math.hypot(p[0] - last[0], p[1] - last[1]) >= step) {
      out.push(p)
      last = p
    }
  }
  out.push(ring[ring.length - 1])
  return out.length >= 4 ? out : ring
}

function build(data, step) {
  let d = ""
  let points = 0
  for (const feature of data.features) {
    for (const polygon of polygonsOf(feature.geometry)) {
      const maxLat = Math.max(...polygon[0].map((p) => p[1]))
      if (maxLat < -60) continue

      for (const ring of polygon) {
        const pts = []
        for (const [lng, lat] of thin(ring, step)) {
          const point = `${round(lng + 180)} ${round(90 - lat)}`
          if (pts[pts.length - 1] !== point) pts.push(point)
        }
        if (pts.length < 3) continue
        d += `M${pts.join("L")}Z`
        points += pts.length
      }
    }
  }
  return { d, points }
}

const data = JSON.parse(readFileSync(input, "utf8"))
const detailed = build(data, 0.3)
const light = build(data, 0.8)

writeFileSync("scripts/land-path.txt", detailed.d)
writeFileSync(
  "src/data/land.ts",
  `// Generado por scripts/make-land.mjs. No lo edites a mano.\nexport const LAND_PATH = "${light.d}"\n`,
)

const kb = (s) => (s.length / 1024).toFixed(0)
console.log(`Icono: ${detailed.points} puntos, ${kb(detailed.d)} KB`)
console.log(`Portada: ${light.points} puntos, ${kb(light.d)} KB`)