import { statSync } from "node:fs"
import sharp from "sharp"

const [input = "perro-original.png"] = process.argv.slice(2)
const THRESHOLD = 238

const { data, info } = await sharp(input)
  .resize({ width: 640, withoutEnlargement: true })
  .ensureAlpha()
  .raw()
  .toBuffer({ resolveWithObject: true })

const { width, height } = info
const seen = new Uint8Array(width * height)
const stack = []

function isBackground(p) {
  const i = p * 4
  return (
    data[i] >= THRESHOLD && data[i + 1] >= THRESHOLD && data[i + 2] >= THRESHOLD
  )
}

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
  data[p * 4 + 3] = 0
  const x = p % width
  const y = (p - x) / width
  push(x + 1, y)
  push(x - 1, y)
  push(x, y + 1)
  push(x, y - 1)
}

await sharp(data, { raw: { width, height, channels: 4 } })
  .png({ compressionLevel: 9 })
  .toFile("public/perro.png")

const kb = (statSync("public/perro.png").size / 1024).toFixed(0)
console.log(`public/perro.png generado (${kb} KB)`)