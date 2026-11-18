import { readFileSync, statSync } from "node:fs"

const GEO = "public/data/countries.geo.json"
const LIST = "src/data/countries.ts"
const TOLERANCE = 0.3
const FEW_POINTS = 30

const geo = JSON.parse(readFileSync(GEO, "utf8"))
const shapes = new Map()
for (const f of geo.features) {
  const code = f.properties.ISO_A2_EH ?? f.properties.ISO_A2
  if (code) shapes.set(code, f.geometry)
}

const countries = readFileSync(LIST, "utf8")
  .split("\n")
  .filter((line) => line.trim().startsWith("{"))
  .map((line) => JSON.parse(line.trim().replace(/,$/, "")))

const polygonsOf = (g) => (g.type === "Polygon" ? [g.coordinates] : g.coordinates)

function inRing(x, y, ring) {
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

const inPolygon = (x, y, polygon) =>
  inRing(x, y, polygon[0]) && !polygon.slice(1).some((hole) => inRing(x, y, hole))

function nearest(x, y, polygons) {
  let best = Infinity
  for (const polygon of polygons) {
    for (const [px, py] of polygon[0]) best = Math.min(best, Math.hypot(px - x, py - y))
  }
  return best
}

const outside = []
const noShape = []
const simple = []
let inside = 0
let near = 0

for (const c of countries) {
  const geometry = shapes.get(c.code)
  if (!geometry) {
    noShape.push(`${c.code} ${c.name}`)
    continue
  }
  const polygons = polygonsOf(geometry)
  const points = polygons.reduce(
    (sum, p) => sum + p.reduce((s, ring) => s + ring.length, 0),
    0,
  )
  if (points < FEW_POINTS) simple.push(`${c.code} ${c.name} (${points} puntos)`)

  if (polygons.some((p) => inPolygon(c.capitalLng, c.capitalLat, p))) {
    inside++
    continue
  }
  const d = nearest(c.capitalLng, c.capitalLat, polygons)
  if (d <= TOLERANCE) near++
  else {
    outside.push(
      `${c.code} ${c.name}: ${c.capital} a ${d.toFixed(2)}° (unos ${Math.round(d * 111)} km) de la silueta`,
    )
  }
}

function repeated(key) {
  const seen = new Map()
  for (const c of countries) {
    const k = c[key].toLowerCase()
    seen.set(k, [...(seen.get(k) ?? []), c.code])
  }
  return [...seen.entries()].filter(([, codes]) => codes.length > 1)
}

const size = statSync(GEO).size / 1e6
console.log(`Países en la lista: ${countries.length} (esperados: 232)`)
console.log(`Archivo de contornos: ${size.toFixed(2)} MB`)
console.log(`Capital dentro de la silueta: ${inside} · muy cerca (<${TOLERANCE}°): ${near}`)

const report = (title, items) => {
  if (items.length) console.log(`\n${title}:\n  ${items.join("\n  ")}`)
}
report("SIN SILUETA", noShape)
report("CAPITAL FUERA DE LA SILUETA (revisar)", outside)
report("SILUETAS MUY SIMPLES (míralas a ojo)", simple)
report(
  "NOMBRES DE PAÍS REPETIDOS (error)",
  repeated("name").map(([n, codes]) => `${n}: ${codes.join(", ")}`),
)
report(
  "CAPITALES CON EL MISMO NOMBRE (no es error, se aceptan para ambos)",
  repeated("capital").map(([n, codes]) => `${n}: ${codes.join(", ")}`),
)