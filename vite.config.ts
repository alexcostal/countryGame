import { fileURLToPath } from "node:url"
import tailwindcss from "@tailwindcss/vite"
import react from "@vitejs/plugin-react"
import { defineConfig } from "vite"
import { VitePWA } from "vite-plugin-pwa"

const buildDate = new Date()
  .toLocaleString("sv-SE", { timeZone: "Europe/Madrid" })
  .slice(0, 16)

export default defineConfig(({ command, isPreview }) => {
  const base = command === "build" || isPreview ? "/countryGame/" : "/"

  return {
    base,
    define: { __APP_VERSION__: JSON.stringify(buildDate) },
    plugins: [
      react(),
      tailwindcss(),
      VitePWA({
        registerType: "autoUpdate",
        manifest: {
          name: "Country game",
          short_name: "Country game",
          description: "Adivina países y capitales por su silueta.",
          lang: "es",
          theme_color: "#0e2250",
          background_color: "#0e2250",
          display: "standalone",
          orientation: "portrait",
          start_url: base,
          scope: base,
          icons: [
            { src: "pwa-192x192.png", sizes: "192x192", type: "image/png" },
            { src: "pwa-512x512.png", sizes: "512x512", type: "image/png" },
            {
              src: "maskable-icon-512x512.png",
              sizes: "512x512",
              type: "image/png",
              purpose: "maskable",
            },
          ],
        },
        workbox: {
          globPatterns: ["**/*.{js,css,html,svg,png,ico,woff2,json}"],
          maximumFileSizeToCacheInBytes: 15 * 1024 * 1024,
        },
      }),
    ],
    resolve: {
      alias: { "@": fileURLToPath(new URL("./src", import.meta.url)) },
    },
  }
})