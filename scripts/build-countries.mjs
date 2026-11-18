import { readFileSync, writeFileSync } from "node:fs"
import { SOURCE } from "./countries-src.mjs"

const GEO = "public/data/countries.geo.json"
const OUT = "src/data/countries.ts"
const MARGIN = 1.5

const geo = JSON.parse(readFileSync(GEO, "utf8"))
const shapes = new Map()
for (const f of geo.features) {
  const code = f.properties.ISO_A2_EH ?? f.properties.ISO_A2
  if (code) shapes.set(code, { name: f.properties.NAME, geometry: f.geometry })
}

const polygonsOf = (g) => (g.type === "Polygon" ? [g.coordinates] : g.coordinates)

function boxOf(polygon) {
  let minX = Infinity
  let maxX = -Infinity
  let minY = Infinity
  let maxY = -Infinity
  for (const [x, y] of polygon[0]) {
    if (x < minX) minX = x
    if (x > maxX) maxX = x
    if (y < minY) minY = y
    if (y > maxY) maxY = y
  }
  return { minX, maxX, minY, maxY }
}

const area = (b) => (b.maxX - b.minX) * (b.maxY - b.minY)
const round1 = (n) => Math.round(n * 10) / 10

const seen = new Set()
const countries = []
const missing = []
const suspicious = []

for (const [code, name, capital, capitalLat, capitalLng, continent] of SOURCE) {
  if (seen.has(code)) throw new Error(`Código repetido: ${code}`)
  seen.add(code)

  const shape = shapes.get(code)
  if (!shape) {
    missing.push(`${code} ${name}`)
    continue
  }

  const boxes = polygonsOf(shape.geometry).map(boxOf)
  const main = boxes.reduce((a, b) => (area(b) > area(a) ? b : a))
  const inside = boxes.some(
    (b) =>
      capitalLng >= b.minX - MARGIN &&
      capitalLng <= b.maxX + MARGIN &&
      capitalLat >= b.minY - MARGIN &&
      capitalLat <= b.maxY + MARGIN,
  )
  if (!inside) {
    suspicious.push(`${code} ${name}: la capital ${capital} (${capitalLat}, ${capitalLng}) cae fuera de su silueta`)
  }

  countries.push({
    code,
    name,
    capital,
    capitalLat,
    capitalLng,
    continent,
    lat: round1((main.minY + main.maxY) / 2),
    lng: round1((main.minX + main.maxX) / 2),
  })
}

const extra = [...shapes.entries()]
  .filter(([code]) => !seen.has(code) && code !== "AQ")
  .map(([code, s]) => `${code} ${s.name ?? ""}`.trim())

const text = `// Archivo generado por scripts/build-countries.mjs. No lo edites a mano.
import type { Country } from "@/game/types"

export const COUNTRIES: Country[] = [
${countries.map((c) => `  ${JSON.stringify(c)},`).join("\n")}
]
`
writeFileSync(OUT, text)

console.log(`${countries.length} países escritos en ${OUT}`)
if (missing.length) {
  console.log(`\nSin silueta en el mapa (no incluidos):\n  ${missing.join("\n  ")}`)
}
if (suspicious.length) {
  console.log(`\nCapitales a revisar:\n  ${suspicious.join("\n  ")}`)
}
if (extra.length) {
  console.log(`\nEn el mapa pero no en tu lista (por si quieres añadirlos):\n  ${extra.join("\n  ")}`)
}