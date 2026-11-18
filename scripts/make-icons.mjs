import sharp from "sharp"

const icons = {
  "pwa-192x192.png": 192,
  "pwa-512x512.png": 512,
  "maskable-icon-512x512.png": 512,
  "apple-touch-icon-180x180.png": 180,
}

for (const [name, size] of Object.entries(icons)) {
  await sharp("public/icon.svg", { density: 300 })
    .resize(size, size)
    .png()
    .toFile(`public/${name}`)
  console.log(`public/${name}`)
}