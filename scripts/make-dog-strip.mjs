import { statSync, writeFileSync } from "node:fs"
import sharp from "sharp"

const [input = "perros-hoja.png"] = process.argv.slice(2)
const TOLERANCE = 28
const COLUMNS = 2
const TARGET_H = 168
const PAD = 12
const ORDER = [0, 1, 2, 3, 4, 5]

const { data, info } = await sharp(input)
  .ensureAlpha()
  .raw()
  .toBuffer({ resolveWithObject: true })
const { width, height } = info
const total = width * height

const corners = [
  [0, 0],
  [width - 1, 0],
  [0, height - 1],
  [width - 1, height - 1],
].map(([x, y]) => {
  const i = (y * width + x) * 4
  return [data[i], data[i + 1], data[i + 2], data[i + 3]]
})
console.log(`Imagen: ${width} x ${height}`)
console.log(
  `Esquinas (R,G,B,A): ${corners.map((c) => c.join(",")).join("  |  ")}`,
)

const transparent = corners.every((c) => c[3] < 128)
const ref = [0, 1, 2].map((k) =>
  Math.round(corners.reduce((s, c) => s + c[k], 0) / corners.length),
)
console.log(
  transparent
    ? "Fondo: transparente"
    : `Fondo: color ${ref.join(",")} (tolerancia ${TOLERANCE})`,
)

const isBackground = (p) => {
  const i = p * 4
  if (data[i + 3] < 128) return true
  if (transparent) return false
  return (
    Math.abs(data[i] - ref[0]) <= TOLERANCE &&
    Math.abs(data[i + 1] - ref[1]) <= TOLERANCE &&
    Math.abs(data[i + 2] - ref[2]) <= TOLERANCE
  )
}

const bg = new Uint8Array(total)
const seen = new Uint8Array(total)
const stack = []

function push(x, y) {
  if (x < 0 || y < 0 || x >= width || y >= height) return
  const p = y * width + x
  if (seen[p]) return
  seen[p] = 1
  if (isBackground(p)) stack.push(p)
}

for (let x = 0; x < width; x++) {
  push(x, 0)
  push(x, height - 1)
}
for (let y = 0; y < height; y++) {
  push(0, y)
  push(width - 1, y)
}
while (stack.length) {
  const p = stack.pop()
  bg[p] = 1
  const x = p % width
  const y = (p - x) / width
  push(x + 1, y)
  push(x - 1, y)
  push(x, y + 1)
  push(x, y - 1)
}

const label = new Int32Array(total)
const comps = []
for (let start = 0; start < total; start++) {
  if (bg[start] || label[start]) continue
  const comp = {
    id: comps.length + 1,
    area: 0,
    sumX: 0,
    minX: width,
    maxX: 0,
    minY: height,
    maxY: 0,
  }
  const st = [start]
  label[start] = comp.id
  while (st.length) {
    const p = st.pop()
    const x = p % width
    const y = (p - x) / width
    comp.area++
    comp.sumX += x
    if (x < comp.minX) comp.minX = x
    if (x > comp.maxX) comp.maxX = x
    if (y < comp.minY) comp.minY = y
    if (y > comp.maxY) comp.maxY = y
    for (let dy = -1; dy <= 1; dy++) {
      for (let dx = -1; dx <= 1; dx++) {
        if (!dx && !dy) continue
        const nx = x + dx
        const ny = y + dy
        if (nx < 0 || ny < 0 || nx >= width || ny >= height) continue
        const q = ny * width + nx
        if (bg[q] || label[q]) continue
        label[q] = comp.id
        st.push(q)
      }
    }
  }
  comps.push(comp)
}

const maxArea = comps.reduce((m, c) => Math.max(m, c.area), 0)
const dogs = comps.filter((c) => c.area > maxArea * 0.05)
console.log(`Perros detectados: ${dogs.length} (deben ser 6)`)

dogs.sort((a, b) => a.minY + a.maxY - (b.minY + b.maxY))
const ordered = []
for (let i = 0; i < dogs.length; i += COLUMNS) {
  ordered.push(
    ...dogs
      .slice(i, i + COLUMNS)
      .sort((a, b) => a.sumX / a.area - b.sumX / b.area),
  )
}

const frames = ORDER.map((i) => ordered[i])
  .filter(Boolean)
  .map((f) => ({ ...f, h: f.maxY - f.minY + 1 }))

frames.forEach((f, n) =>
  console.log(`  ${n}: ${f.maxX - f.minX + 1} x ${f.h} px`),
)

const maxW = Math.max(...frames.map((f) => f.maxX - f.minX + 1))
const cellW = maxW + PAD * 2
const cellH = Math.max(...frames.map((f) => f.h)) + PAD * 2
const stripW = cellW * frames.length

const strip = Buffer.alloc(stripW * cellH * 4)
frames.forEach((f, n) => {
  const offX = cellW - PAD - (f.maxX + 1)
  const offY = cellH - PAD - (f.maxY + 1)
  for (let y = f.minY; y <= f.maxY; y++) {
    for (let x = f.minX; x <= f.maxX; x++) {
      const p = y * width + x
      if (label[p] !== f.id) continue
      const o = ((y + offY) * stripW + n * cellW + x + offX) * 4
      const i = p * 4
      strip[o] = data[i]
      strip[o + 1] = data[i + 1]
      strip[o + 2] = data[i + 2]
      strip[o + 3] = data[i + 3]
    }
  }
})

const frameW = Math.round((cellW * TARGET_H) / cellH)
await sharp(strip, { raw: { width: stripW, height: cellH, channels: 4 } })
  .resize({ width: frameW * frames.length, height: TARGET_H })
  .png({ compressionLevel: 9, palette: true, quality: 90 })
  .toFile("public/perro-strip.png")

writeFileSync(
  "src/data/dogSprite.ts",
  `// Generado por scripts/make-dog-strip.mjs. No lo edites a mano.\nexport const DOG_FRAMES = ${frames.length}\nexport const DOG_ASPECT = ${(frameW / TARGET_H).toFixed(4)}\n`,
)

const kb = (statSync("public/perro-strip.png").size / 1024).toFixed(0)
console.log(`public/perro-strip.png generado (${kb} KB)`)